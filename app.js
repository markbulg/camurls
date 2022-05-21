const host = process.env.HOST || '0.0.0.0';  // Listen on a specific host via the HOST environment variable
const port = process.env.PORT || 8091;       // Listen on a specific port via the PORT environment variable

const request   = require('request')						//npm install request
,     express   = require('express')						//npm install express
,     app       = express()
,     http      = require('http').createServer(app)
,     MjpegDecoder = require('mjpeg-decoder')				//npm install mjpeg-decoder
,     dotenv    = require('dotenv').config()				//npm i dotenv
,     decrypt   = require('./lib/decrypt.js');

function server() {
	app.get('/', async (req, res) => {
        const hmac      = {value: req.query.hmac.replaceAll('%2B', '+')}
		,     encrypted = req.query.src.replaceAll('%2B', '+')
		,     decrypted = decrypt(encrypted, hmac)
        ,     src       = decrypted + req.query.r;
 
        //console.log("hmac value: " + hmac.value);
        //console.log("Encrypted: " + encrypted);
		//console.log("Decrypted: " + decrypted);
		
        if (req.query.action === 'snapshot') {
			//console.log("snapshot of: " + decrypted);
			
 			const decoder = MjpegDecoder.decoderForSnapshot(decrypted)
            ,     frame   = await decoder.takeSnapshot();
			
            res.send(frame);
	    }
	    else {
			//console.log('src: ' + src);
			
	        request(
			    {rejectUnauthorized: false, url: src, encoding: null}, (err, resp, buffer) => {
                    if (!err && resp.statusCode === 200) {
                        res.set("Content-Type", "image/jpeg");
                        res.send(resp.body);
                    }
				    else {
					    console.log('processing error for src: ' + src);
					    console.log('err: ' + err);
    				}
                });
		}
    });
	
	http.listen(port, host, () => {
        console.log('Server started');
	});
}

server();
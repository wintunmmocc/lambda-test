import { Context, 
    APIGatewayProxyResult, 
    APIGatewayEvent ,
    Handler,
    S3Event 
} from 'aws-lambda';
import {S3Client, GetObjectCommand} from '@aws-sdk/client-s3';

console.log("Loading Function");
const s3 = new S3Client({region: 'ap-northeast-1'});
export const handler:Handler = async (event:S3Event , context: Context) => {
    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const keySplit = key.split('.');
    const fileType = keySplit[keySplit.length-1];
    // file type handling
    if(fileType === "csv"){
        const params = {
            Bucket: bucket,
            Key: key,
        }; 
        /*email send function on later for receiving correct file on s3*/
        try{
            // csv processing
            const data = await s3.send(new GetObjectCommand(params));
            const {ContentType,Body}  = data;
            console.log("CSV File Correct Condition");
            streamToString(Body)
            .then(result=>{
            console.log("File Type",ContentType);
            console.log("The Result",result);
            return result;
            })
            .catch(error=>{
            console.log("The error",error);
            return error;
            });    
        }catch(error){
            // csv processing error
            console.log(error);
            return error;
        }
    }else{
        /*email send function on later for receiving incorrect file on s3*/
        console.log("File Type wrong Condition");
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure FileType to be CSV.`;
        console.log(message);
        const response = {
        data:message,
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
        };
        return response;
    }; 
};

// helper function to convert csv
const streamToString = (stream:any) => new Promise((resolve, reject) => {
    const chunks:any = [];
    stream.on('data', (chunk:never) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
      
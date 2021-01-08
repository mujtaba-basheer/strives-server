const AWS = require("aws-sdk");
const dotenv = require("dotenv");
dotenv.config();
const applicationId = process.env.PINPOINT_APPLICATION_ID;

AWS.config.update({
    region: process.env.PINPINT_REGION,
    accessKeyId: process.env.PINPOINT_ACCESS_KEY,
    secretAccessKey: process.env.PINPOINT_SECRET_KEY,
});

const pinpoint = new AWS.Pinpoint();

const generatePass = (length = 6) => {
    let pass = "";
    for (let i = 0; i < length; i++) {
        pass += String.fromCharCode(97 + Math.ceil(Math.random() * 25));
    }
    return pass;
};

const sendNewPassword = (destination) => {
    const destinationEmail = destination;
    const senderEmail = "Arquam Ejaz <arquam007@gmail.com>";
    const newPassword = generatePass();

    const html = `<body>
                    <p>
                        <h2>Greetings from The Strives</h2>
                        <h3>Your new password is: ${newPassword}.</h3>
                    </p>
                    <p>
                        Thanking You,<br />The Strives
                    </p>
                </body>`;

    const raw = `Greetings from The Strives.\nYour new password is: ${newPassword}.
                \nThanking You,\nThe Strives.`;

    const params = {
        ApplicationId: applicationId,
        MessageRequest: {
            Addresses: {
                [destinationEmail]: {
                    ChannelType: "EMAIL",
                },
            },
            MessageConfiguration: {
                EmailMessage: {
                    Body: html,
                    FromAddress: senderEmail,
                    // RawEmail: {
                    //     Data: raw,
                    // },
                    SimpleEmail: {
                        HtmlPart: {
                            Data: html,
                        },
                        Subject: {
                            Data: "New Password",
                        },
                        TextPart: {
                            Data: raw,
                        },
                    },
                },
            },
        },
    };

    return new Promise((res, rej) => {
        pinpoint.sendMessages(params, (err, data) => {
            if (err) rej(err);
            else if (
                data.MessageResponse.Result[destinationEmail].StatusCode !== 200
            )
                rej(
                    new Error(
                        data.MessageResponse.Result[
                            destinationEmail
                        ].StatusMessage
                    )
                );
            else
                res({
                    pass: newPassword,
                    data,
                });
        });
    });
};

module.exports = { sendNewPassword };

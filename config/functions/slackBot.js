require("dotenv").config();
const fetch = require("node-fetch");
const SlackError = (message, err, callback) => {

    const environment = process.env.NODE_ENV === "dev" ? "SB" : "PR";

    const payload = {
        "text": `*${process.env.PROJNAME}* (_${environment}_):\n${message}>${err}`,
    }

    fetch("https://hooks.slack.com/services/THE1J8NDR/B05NSKZ0JV7/V4G6ZOieVKz5ICcDr5zU", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
        .then(status => {
            console.log({ status });
            callback();
        })
        .catch(err => {
            console.error("Error sending error message to slack : \n", err);
            callback();
        });
};

module.exports = SlackError;
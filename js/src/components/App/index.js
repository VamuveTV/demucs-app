import React from "react";

import FileInput from "../FileInput";
import ResultTable from "../ResultTable";

// This is being loaded on the HTML head
const Algorithmia = window.Algorithmia;

class App extends React.Component {
    constructor(props) {
        super(props);

        this.client = Algorithmia.client("simhcwLH5wkxwTnyMVJFazxsHqG1");

        // const testResults = {
        //     bass: "670f09de-0c8a-4108-bab1-c3553cf2ee09-bass.mp3",
        //     drums: "670f09de-0c8a-4108-bab1-c3553cf2ee09-drums.mp3",
        //     other: "670f09de-0c8a-4108-bab1-c3553cf2ee09-other.mp3",
        //     vocals: "670f09de-0c8a-4108-bab1-c3553cf2ee09-vocals.mp3",
        // };

        this.state = {
            apiStatus: "init",
            results: "",
            // results: testResults,
            error: "",
            converting: false,
        };
    }

    componentDidMount() {
        this.client
            .algo("danielfrg/demucs/0.2.0")
            .pipe({ health: "" })
            .then((response) => {
                if (response.error) {
                    console.error("Error: " + response.error.message);
                    this.setState({
                        apiStatus: "error",
                        error: response.error.message,
                    });
                } else {
                    console.log(response);
                    if (response.result.status == "live") {
                        this.setState({ apiStatus: "loading" });

                        this.client
                            .algo("danielfrg/demucs/0.2.0")
                            .pipe({ load: "" })
                            .then((response) => {
                                if (response.error) {
                                    console.error(
                                        "Error: " + response.error.message
                                    );
                                    this.setState({
                                        apiStatus: "error",
                                        error: response.error.message,
                                    });
                                } else {
                                    console.log(response);
                                    this.setState({ apiStatus: "ready" });
                                }
                            });
                    } else if (response.result.status == "model_loaded") {
                        this.setState({ apiStatus: "ready" });
                    }
                }
            });
    }

    bufferToBase64 = (buffer) => {
        var bytes = new Uint8Array(buffer);
        var len = buffer.byteLength;
        var binary = "";
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    request = (file) => {
        var reader = new FileReader();
        reader.onload = (event) => {
            const base64_file = this.bufferToBase64(event.target.result);

            this.setState({ converting: true });
            this.client
                .algo("danielfrg/demucs/0.2.0")
                .pipe({ predict: { base64: base64_file } })
                .then((response) => {
                    if (response.error) {
                        console.error("Error: " + response.error.message);
                        this.setState({
                            apiStatus: "error",
                            error: response.error.message,
                        });
                    } else {
                        console.log(response);
                        this.setState({
                            converting: false,
                            results: response.result,
                        });
                    }
                });
        };
        reader.readAsArrayBuffer(file);
    };

    render() {
        let statusText = "";
        if (this.state.apiStatus == "init") {
            statusText = "Initializing API (~1-2 mins)";
        } else if (this.state.apiStatus == "loading") {
            statusText = "Loading model (~5 mins)";
        } else if (this.state.apiStatus == "ready") {
            statusText = "Model ready";
        }

        const apiStatus = (
            <p className="api-status">API Status: {statusText}</p>
        );

        if (this.state.apiStatus !== "ready") {
            return apiStatus;
        }

        if (this.state.error) {
            return (
                <React.Fragment>
                    {apiStatus}
                    <p className="error">ERROR: {this.state.error}</p>
                </React.Fragment>
            );
        }

        let results = "";
        if (this.state.converting === true) {
            results = <div className="loader">... converting ...</div>;
        } else if (this.state.results) {
            results = (
                <ResultTable client={this.client} {...this.state.results} />
            );
        }

        return (
            <React.Fragment>
                {apiStatus}
                <FileInput request={this.request} />
                {results}
            </React.Fragment>
        );
    }
}

export default App;

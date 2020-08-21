import React, { Fragment } from "react";
import Loader from "react-loaders";

import FileInput from "../FileInput";
import ResultTable from "../ResultTable";
import DemucsAPI from "./algorithms";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.client = new DemucsAPI();

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
        this.client.health().then((response) => {
            if (response.error) {
                this.setState({
                    apiStatus: "error",
                    error: response.error,
                });
            } else {
                console.log(response);
                if (response.result.status == "live") {
                    this.setState({ apiStatus: "loading" });

                    this.client.load().then((response) => {
                        if (response.error) {
                            this.setState({
                                apiStatus: "error",
                                error: response.error,
                            });
                        } else {
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
            this.client.separate(base64_file).then((response) => {
                if (response.error) {
                    console.error("Error: " + response.error);
                    this.setState({
                        error: response.error,
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
        } else if (this.state.apiStatus == "error") {
            statusText = "Error";
        } else {
            statusText = this.state.apiStatus;
        }

        const spinnerEl = (
            <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
            </div>
        );

        const apiStatus = (
            <div className="status-line">
                <p className="api-status">API Status: {statusText}</p>
                {this.state.apiStatus == "ready" ||
                this.state.apiStatus == "error"
                    ? ""
                    : spinnerEl}
            </div>
        );

        if (this.state.error) {
            if (
                typeof this.state.error === "string" ||
                this.state.error instanceof String
            ) {
                return (
                    <Fragment>
                        {apiStatus}
                        <p className="error">Error: {this.state.error}</p>
                    </Fragment>
                );
            } else {
                return (
                    <Fragment>
                        {apiStatus}
                        <p className="error">
                            {this.state.error.error_type
                                ? this.state.error.error_type
                                : "Error"}
                            : {this.state.error.message}
                        </p>
                        <p className="error text-left">
                            {this.state.error.stacktrace}
                        </p>
                    </Fragment>
                );
            }
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
                <FileInput
                    enabled={this.state.apiStatus == "ready"}
                    request={this.request}
                />
                {results}
            </React.Fragment>
        );
    }
}

export default App;

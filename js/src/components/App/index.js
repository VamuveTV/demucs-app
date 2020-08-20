import React from "react";

import FileInput from "../FileInput";

// const ENDPOINT = "http://127.0.0.1:8000";
const ENDPOINT = "http://34.209.140.45";
const HEALTH = "/healthz";
const STATUS = "/status";
const SEPARATE = "/separate";

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            apiStatus: "",
            splited: "",
            error: "",
            converting: false,
        };
    }

    componentDidMount() {
        this.setState({ apiStatus: "none" });

        fetch(ENDPOINT + HEALTH)
            .then((response) => response.json())
            .then((data) => {
                if (data == "ok") {
                    this.setState({ apiStatus: "loading model" });
                    fetch(ENDPOINT + STATUS)
                        .then((response) => response.json())
                        .then((data) => {
                            if (data == "model_loaded") {
                                this.setState({ apiStatus: "ready" });
                            }
                        })
                        .catch((error) =>
                            this.setState({ apiStatus: "error", error: error })
                        );
                }
            })
            .catch((error) =>
                this.setState({ apiStatus: "error", error: error })
            );
    }

    request = (file) => {
        this.setState({ converting: true });
        const formData = new FormData();
        formData.append("file", file);

        fetch(ENDPOINT + SEPARATE, {
            method: "POST",
            body: formData,
        })
            .then((response) => response.json())
            .then((success) => {
                this.setState({ splited: success, converting: false });
                console.log(success);
            })
            .catch((error) => {
                console.log(error);
                this.setState({ error: error, converting: false });
            });
    };

    render() {
        const apiStatus = (
            <p className="api-status">API Status: {this.state.apiStatus}</p>
        );

        if (this.state.apiStatus != "ready") {
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

        let waiting = "";

        if (this.state.converting === true) {
            waiting = <div className="loader">... converting ...</div>;
        }

        let splited = "";

        if (this.state.splited) {
            splited = (
                <table className="audio-table">
                    <tbody>
                        <tr>
                            <th>Instrument</th>
                            <th>Track</th>
                        </tr>
                        <tr>
                            <td>Drums</td>
                            <td>
                                <audio controls>
                                    <track kind="captions"></track>
                                    <source
                                        src={
                                            ENDPOINT +
                                            "/" +
                                            this.state.splited.drums
                                        }
                                        type="audio/mp3"
                                    />
                                </audio>
                            </td>
                        </tr>
                        <tr>
                            <td>Bass</td>
                            <td>
                                <audio controls>
                                    <track kind="captions"></track>
                                    <source
                                        src={
                                            ENDPOINT +
                                            "/" +
                                            this.state.splited.bass
                                        }
                                        type="audio/mp3"
                                    />
                                </audio>
                            </td>
                        </tr>
                        <tr>
                            <td>Other</td>
                            <td>
                                <audio controls>
                                    <track kind="captions"></track>
                                    <source
                                        src={
                                            ENDPOINT +
                                            "/" +
                                            this.state.splited.other
                                        }
                                        type="audio/mp3"
                                    />
                                </audio>
                            </td>
                        </tr>
                        <tr>
                            <td>Vocals</td>
                            <td>
                                <audio controls>
                                    <track kind="captions"></track>
                                    <source
                                        src={
                                            ENDPOINT +
                                            "/" +
                                            this.state.splited.vocals
                                        }
                                        type="audio/mp3"
                                    />
                                </audio>
                            </td>
                        </tr>
                    </tbody>
                </table>
            );
        }

        return (
            <React.Fragment>
                {apiStatus}
                <FileInput request={this.request} />
                {waiting}
                {splited}
            </React.Fragment>
        );
    }
}

export default App;

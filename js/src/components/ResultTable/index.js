import React from "react";

const Algorithmia = window.Algorithmia;

class ResultTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            drums: "",
            bass: "",
            other: "",
            vocals: "",
        };
    }

    componentDidMount() {
        const { client, drums, bass, other, vocals } = this.props;

        const items = {
            drums: drums,
            bass: bass,
            other: other,
            vocals: vocals,
        };

        for (let source in items) {
            var algo_file_path = `data://danielfrg/demucs_output/${items[source]}`;
            client
                .algo("ANaimi/Base64DataConverter/0.1.2?timeout=300") // timeout is optional
                .pipe(algo_file_path)
                .then((output) => {
                    console.log(source);
                    console.log(output);
                    this.setState({
                        [source]: output.result,
                    });
                });
        }
    }

    render() {
        let drums, bass, other, vocals;
        if (this.state.drums) {
            drums = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio controls>
                    <source
                        src={`data:audio/mp3;base64,${this.state.drums}`}
                        type="audio/mp3"
                    />
                </audio>
            );
        }

        if (this.state.bass) {
            bass = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio controls>
                    <source
                        src={`data:audio/mp3;base64,${this.state.bass}`}
                        type="audio/mp3"
                    />
                </audio>
            );
        }

        if (this.state.other) {
            other = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio controls>
                    <source
                        src={`data:audio/mp3;base64,${this.state.other}`}
                        type="audio/mp3"
                    />
                </audio>
            );
        }

        if (this.state.vocals) {
            vocals = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio
                    controls
                    src={`data:audio/mp3;base64,${this.state.vocals}`}
                ></audio>
            );
        }
        return (
            <table className="audio-table">
                <tbody>
                    <tr>
                        <th>Instrument</th>
                        <th>Track</th>
                    </tr>
                    <tr>
                        <td>Drums</td>
                        <td>{drums}</td>
                    </tr>
                    <tr>
                        <td>Bass</td>
                        <td>{bass}</td>
                    </tr>
                    <tr>
                        <td>Other</td>
                        <td>{other}</td>
                    </tr>
                    <tr>
                        <td>Vocals</td>
                        <td>{vocals}</td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

export default ResultTable;

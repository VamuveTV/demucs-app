import React from "react";
import Base64DataConverter from "./algorithm";
import Player from "./player";

class ResultTable extends React.Component {
    constructor(props) {
        super(props);

        this.client = new Base64DataConverter();

        this.state = {
            drums: "",
            bass: "",
            other: "",
            vocals: "",
        };
    }

    // componentDidMount() {
    //     const { drums, bass, other, vocals } = this.props;

    //     const items = {
    //         drums: drums,
    //         bass: bass,
    //         other: other,
    //         vocals: vocals,
    //     };

    //     for (let source in items) {
    //         var algoFilePath = ;
    //     }
    // }

    render() {
        let bassEl, drumsEl, otherEl, vocalsEl;

        if (this.props.bass) {
            bassEl = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <Player
                    client={this.client}
                    algoFilePath={`data://danielfrg/demucs_output/${this.props.bass}`}
                ></Player>
            );
        }
        if (this.props.drums) {
            drumsEl = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <Player
                    client={this.client}
                    algoFilePath={`data://danielfrg/demucs_output/${this.props.drums}`}
                ></Player>
            );
        }
        if (this.props.other) {
            otherEl = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <Player
                    client={this.client}
                    algoFilePath={`data://danielfrg/demucs_output/${this.props.other}`}
                ></Player>
            );
        }
        if (this.props.vocals) {
            vocalsEl = (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <Player
                    client={this.client}
                    algoFilePath={`data://danielfrg/demucs_output/${this.props.vocals}`}
                ></Player>
            );
        }

        return (
            <div className="results">
                <table>
                    <tbody>
                        <tr>
                            <th>Instrument</th>
                            <th>Track</th>
                        </tr>
                        <tr>
                            <td>Bass</td>
                            <td className="track">{bassEl}</td>
                        </tr>
                        <tr>
                            <td>Drums</td>
                            <td className="track">{drumsEl}</td>
                        </tr>
                        <tr>
                            <td>Other</td>
                            <td className="track">{otherEl}</td>
                        </tr>
                        <tr>
                            <td>Vocals</td>
                            <td className="track">{vocalsEl}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

export default ResultTable;

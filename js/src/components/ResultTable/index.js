import React from "react";
import Base64DataConverter from "./algorithm";
import Player from "./player";

class ResultTable extends React.Component {
    constructor(props) {
        super(props);
        this.client = new Base64DataConverter();
    }

    render() {
        let bassEl, drumsEl, otherEl, vocalsEl;

        if (this.props.bass) {
            bassEl = (
                <Player
                    client={this.client}
                    algoFilePath={`data://danielfrg/demucs_output/${this.props.bass}`}
                ></Player>
            );
        }
        if (this.props.drums) {
            drumsEl = (
                <Player
                    client={this.client}
                    algoFilePath={`data://danielfrg/demucs_output/${this.props.drums}`}
                ></Player>
            );
        }
        if (this.props.other) {
            otherEl = (
                <Player
                    client={this.client}
                    algoFilePath={`data://danielfrg/demucs_output/${this.props.other}`}
                ></Player>
            );
        }
        if (this.props.vocals) {
            vocalsEl = (
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

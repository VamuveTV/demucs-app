import React from "react";

class Player extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            result: "",
        };
    }

    componentDidMount() {
        const { client, algoFilePath } = this.props;

        client.getFile(algoFilePath).then((output) => {
            this.setState({
                loading: false,
                result: output.result,
            });
        });
    }

    render() {
        if (this.state.loading) {
            return (
                <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            );
        }
        return (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio controls>
                <source
                    src={`data:audio/mp3;base64,${this.state.result}`}
                    type="audio/mp3"
                />
            </audio>
        );
    }
}

export default Player;

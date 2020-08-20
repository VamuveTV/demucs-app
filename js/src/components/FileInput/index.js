import React, { Fragment } from "react";

class FileInput extends React.Component {
    constructor(props) {
        super(props);
        this.fileInput = React.createRef();
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        console.log(
            `Sending selected file: ${this.fileInput.current.files[0].name}`
        );

        this.props.request(this.fileInput.current.files[0]);
    }

    render() {
        return (
            <Fragment>
                <p>Select a song to be processed:</p>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        <input
                            type="file"
                            ref={this.fileInput}
                            className="file-picker"
                        />
                    </label>
                    <br />
                    <button type="submit" className="btn btn-light">
                        Submit
                    </button>
                </form>
            </Fragment>
        );
    }
}

export default FileInput;

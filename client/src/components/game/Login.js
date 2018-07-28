import React from 'react';

class Login extends React.Component {
  render() {
    return (
      <div className="login visible">
        <h2>Enter your name</h2>
        <input onKeyPress={this.props.handleEnter} onChange={this.props.handleUsernameChange} type="text" required />
      </div>
    );
  }
}

export default Login;
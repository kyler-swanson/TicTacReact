import React from 'react';

class Dialog extends React.Component {
  renderActions(actions) {
    let actionList = [];
    for (let i = 0; i < actions.length; i++) {
      actionList.push(
        <span key={i} onClick={actions[i].onClick}>{actions[i].action}</span>
      );
    }

    return actionList;
  }

  render() {
    const dialogClasses = "dialog " + (this.props.showDialog ? 'show' : 'hide')
    return (
      <div className={dialogClasses}>
        <div className="dialog-content">
          <h2>{this.props.text}</h2>
          <div className="actions">
            {this.renderActions(this.props.actions)}
          </div>
        </div>
      </div>
    );
  }
}

export default Dialog;
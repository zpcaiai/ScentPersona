import { Component, PropsWithChildren } from "react";
import { getLocale, syncTabBar } from "./lib/i18n";
import "./app.scss";

class App extends Component<PropsWithChildren> {
  componentDidMount() {}

  componentDidShow() {
    // Reflect the saved language choice on the (native) tab bar.
    syncTabBar(getLocale());
  }

  componentDidHide() {}

  render() {
    return this.props.children;
  }
}

export default App;

package signum.net;

import brs.props.Props;

public class TestnetNetwork2 extends TestnetNetwork {

  public TestnetNetwork2() {

    setProperty(Props.NETWORK_NAME, "Signum-TESTNET-2");

    setProperty(Props.ADDRESS_PREFIX, "TS");
    setProperty(Props.VALUE_SUFIX, "TSIGNA");
    setProperty(Props.EXPERIMENTAL, "true");

    setProperty(Props.P2P_PORT, "7124");

    setProperty(Props.SMART_ATS_HEIGHT, "416060");

    setProperty(Props.P2P_REBROADCAST_TO, "77.56.66.83");
    setProperty(Props.P2P_BOOTSTRAP_PEERS, "77.56.66.83");

    setProperty(Props.P2P_NUM_BOOTSTRAP_CONNECTIONS, "1");
  }
}

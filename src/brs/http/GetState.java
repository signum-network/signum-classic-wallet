package brs.http;

import brs.*;
import brs.assetexchange.AssetExchange;
import brs.peer.Peer;
import brs.peer.Peers;
import brs.props.PropertyService;
import brs.props.Props;
import brs.services.ATService;
import brs.services.AccountService;
import brs.services.AliasService;
import brs.services.EscrowService;
import brs.services.TimeService;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.INCLUDE_COUNTS_PARAMETER;
import static brs.http.JSONResponses.ERROR_NOT_ALLOWED;
import static brs.http.common.Parameters.API_KEY_PARAMETER;
import static brs.http.common.ResultFields.TIME_RESPONSE;

import java.util.List;

final class GetState extends APIServlet.JsonRequestHandler {

  private final Blockchain blockchain;
  private final AssetExchange assetExchange;
  private final AccountService accountService;
  private final AliasService aliasService;
  private final TimeService timeService;
  private final ATService atService;
  private final Generator generator;
  private final PropertyService propertyService;
  private final List<String> apiAdminKeyList;

  GetState(Blockchain blockchain, AssetExchange assetExchange, AccountService accountService, EscrowService escrowService,
           AliasService aliasService, TimeService timeService, ATService atService, Generator generator, PropertyService propertyService) {
    super(new APITag[] {APITag.INFO}, INCLUDE_COUNTS_PARAMETER, API_KEY_PARAMETER);
    this.blockchain = blockchain;
    this.assetExchange = assetExchange;
    this.accountService = accountService;
    this.aliasService = aliasService;
    this.timeService = timeService;
    this.atService = atService;
    this.generator = generator;
    this.propertyService = propertyService;
    
    apiAdminKeyList = propertyService.getStringList(Props.API_ADMIN_KEY_LIST);
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) {

    JsonObject response = new JsonObject();

    response.addProperty("application", Burst.getPropertyService().getString(Props.APPLICATION));
    response.addProperty("version", Burst.getPropertyService().getString(Props.VERSION));
    response.addProperty(TIME_RESPONSE, timeService.getEpochTime());
    response.addProperty("lastBlock", blockchain.getLastBlock().getStringId());
    response.addProperty("cumulativeDifficulty", blockchain.getLastBlock().getCumulativeDifficulty().toString());
    response.addProperty("totalMinedNQT", blockchain.getTotalMined());

    if ("true".equalsIgnoreCase(req.getParameter(INCLUDE_COUNTS_PARAMETER))) {
      String apiKey = req.getParameter(API_KEY_PARAMETER);
      if(!apiAdminKeyList.contains(apiKey)) {
        return ERROR_NOT_ALLOWED;
      }
      
      long totalEffectiveBalance = accountService.getAllAccountsBalance();
      response.addProperty("totalEffectiveBalance", totalEffectiveBalance / propertyService.getInt(Props.ONE_COIN_NQT));
      response.addProperty("totalEffectiveBalanceNQT", totalEffectiveBalance);
      
      long totalCommitted = blockchain.getCommittedAmount(0L, blockchain.getHeight(), blockchain.getHeight(), null);
      response.addProperty("totalCommittedNQT", totalCommitted);
      
      response.addProperty("numberOfAccounts", accountService.getCount());
    }

    response.addProperty("numberOfBlocks", blockchain.getHeight() + 1);
    response.addProperty("numberOfTransactions", blockchain.getTransactionCount());
    response.addProperty("numberOfATs", atService.getAllATIds(null).size());
    response.addProperty("numberOfAssets", assetExchange.getAssetsCount());
    int askCount = assetExchange.getAskCount();
    int bidCount = assetExchange.getBidCount();
    response.addProperty("numberOfOrders", askCount + bidCount);
    response.addProperty("numberOfAskOrders", askCount);
    response.addProperty("numberOfBidOrders", bidCount);
    response.addProperty("numberOfTrades", assetExchange.getTradesCount());
    response.addProperty("numberOfTransfers", assetExchange.getAssetTransferCount());
    response.addProperty("numberOfAliases", aliasService.getAliasCount());
    
    response.addProperty("numberOfPeers", Peers.getAllPeers().size());
    response.addProperty("numberOfUnlockedAccounts", generator.getAllGenerators().size());
    Peer lastBlockchainFeeder = Burst.getBlockchainProcessor().getLastBlockchainFeeder();
    response.addProperty("lastBlockchainFeeder", lastBlockchainFeeder == null ? null : lastBlockchainFeeder.getAnnouncedAddress());
    response.addProperty("lastBlockchainFeederHeight", Burst.getBlockchainProcessor().getLastBlockchainFeederHeight());
    response.addProperty("isScanning", Burst.getBlockchainProcessor().isScanning());
    response.addProperty("availableProcessors", Runtime.getRuntime().availableProcessors());
    response.addProperty("maxMemory", Runtime.getRuntime().maxMemory());
    response.addProperty("totalMemory", Runtime.getRuntime().totalMemory());
    response.addProperty("freeMemory", Runtime.getRuntime().freeMemory());
    response.addProperty("indirectIncomingServiceEnabled", propertyService.getBoolean(Props.INDIRECT_INCOMING_SERVICE_ENABLE));

    return response;
  }
}

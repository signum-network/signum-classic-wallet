package brs.http;

import brs.Account;
import brs.Block;
import brs.Blockchain;
import brs.Burst;
import brs.BurstException;
import brs.Constants;
import brs.Generator;
import brs.services.AccountService;
import brs.services.ParameterService;
import brs.util.Convert;
import burst.kit.crypto.BurstCrypto;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.ACCOUNT_PARAMETER;
import static brs.http.common.Parameters.HEIGHT_PARAMETER;
import static brs.http.common.Parameters.ESTIMATE_COMMITMENT_PARAMETER;
import static brs.http.common.Parameters.GET_COMMITTED_AMOUNT_PARAMETER;
import static brs.http.common.ResultFields.*;

public final class GetAccount extends APIServlet.JsonRequestHandler {

  private final ParameterService parameterService;
  private final Blockchain blockchain;
  private final AccountService accountService;
  private final Generator generator;

  GetAccount(ParameterService parameterService, AccountService accountService, Blockchain blockchain, Generator generator) {
    super(new APITag[] {APITag.ACCOUNTS}, ACCOUNT_PARAMETER, HEIGHT_PARAMETER, GET_COMMITTED_AMOUNT_PARAMETER, ESTIMATE_COMMITMENT_PARAMETER);
    this.parameterService = parameterService;
    this.blockchain = blockchain;
    this.accountService = accountService;
    this.generator = generator;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {

    Account account = parameterService.getAccount(req);

    JsonObject response = JSONData.accountBalance(account);
    
    int height = parameterService.getHeight(req);
    if(height < 0) {
      height = blockchain.getHeight();
    }
    
    if(parameterService.getAmountCommitted(req)) {
      long committedAmount = Burst.getBlockchain().getCommittedAmount(account.getId(), height+Constants.COMMITMENT_WAIT, height, null);
      response.addProperty(COMMITTED_NQT_RESPONSE, Convert.toUnsignedLong(committedAmount));
    }
    
    if(parameterService.getEstimateCommitment(req)) {
      Block block = blockchain.getBlockAtHeight(height);
      long commitment = generator.estimateCommitment(account.getId(), block);
      response.addProperty(COMMITMENT_NQT_RESPONSE, Convert.toUnsignedLong(commitment));
    }
    
    JSONData.putAccount(response, ACCOUNT_RESPONSE, account.getId());

    if (account.getPublicKey() != null) {
      response.addProperty(ACCOUNT_RESPONSE + "RSExtended", BurstCrypto.getInstance().getBurstAddressFromPublic(account.getPublicKey()).getExtendedAddress());
      response.addProperty(PUBLIC_KEY_RESPONSE, Convert.toHexString(account.getPublicKey()));
    }
    if (account.getName() != null) {
      response.addProperty(NAME_RESPONSE, account.getName());
    }
    if (account.getDescription() != null) {
      response.addProperty(DESCRIPTION_RESPONSE, account.getDescription());
    }

    if(height == blockchain.getHeight()) {
      // Only if the height is the latest as we don't handle past asset balances.
      // Returning assets here is needed by the classic wallet, so we keep it.
      JsonArray assetBalances = new JsonArray();
      JsonArray unconfirmedAssetBalances = new JsonArray();

      for (Account.AccountAsset accountAsset : accountService.getAssets(account.getId(), 0, -1)) {
        JsonObject assetBalance = new JsonObject();
        assetBalance.addProperty(ASSET_RESPONSE, Convert.toUnsignedLong(accountAsset.getAssetId()));
        assetBalance.addProperty(BALANCE_QNT_RESPONSE, String.valueOf(accountAsset.getQuantityQNT()));
        assetBalances.add(assetBalance);
        JsonObject unconfirmedAssetBalance = new JsonObject();
        unconfirmedAssetBalance.addProperty(ASSET_RESPONSE, Convert.toUnsignedLong(accountAsset.getAssetId()));
        unconfirmedAssetBalance.addProperty(UNCONFIRMED_BALANCE_QNT_RESPONSE, String.valueOf(accountAsset.getUnconfirmedQuantityQNT()));
        unconfirmedAssetBalances.add(unconfirmedAssetBalance);
      }

      if (assetBalances.size() > 0) {
        response.add(ASSET_BALANCES_RESPONSE, assetBalances);
      }
      if (unconfirmedAssetBalances.size() > 0) {
        response.add(UNCONFIRMED_ASSET_BALANCES_RESPONSE, unconfirmedAssetBalances);
      }
    }

    return response;
  }

}

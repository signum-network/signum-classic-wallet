package brs.http;

import static brs.http.JSONResponses.INCORRECT_TRANSACTION;
import static brs.http.JSONResponses.MISSING_TRANSACTION;
import static brs.http.JSONResponses.UNKNOWN_TRANSACTION;
import static brs.http.common.Parameters.ACCOUNT_PARAMETER;
import static brs.http.common.Parameters.TRANSACTION_PARAMETER;

import javax.servlet.http.HttpServletRequest;

import com.google.gson.JsonElement;

import brs.Account;
import brs.Blockchain;
import brs.Burst;
import brs.BurstException;
import brs.IndirectIncoming;
import brs.services.ParameterService;
import brs.util.Convert;

final class GetIndirectIncoming extends APIServlet.JsonRequestHandler {

  private final Blockchain blockchain;
  private final ParameterService parameterService;

  GetIndirectIncoming(Blockchain blockchain, ParameterService parameterService) {
    super(new APITag[] {APITag.TRANSACTIONS}, TRANSACTION_PARAMETER, ACCOUNT_PARAMETER);
    this.blockchain = blockchain;
    this.parameterService = parameterService;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {

    Account account = parameterService.getAccount(req);
    String transactionIdString = Convert.emptyToNull(req.getParameter(TRANSACTION_PARAMETER));
    if (transactionIdString == null) {
      return MISSING_TRANSACTION;
    }

    long transactionId = 0;
    try {
      transactionId = Convert.parseUnsignedLong(transactionIdString);
    } catch (RuntimeException e) {
      return INCORRECT_TRANSACTION;
    }

    IndirectIncoming indirect = Burst.getStores().getIndirectIncomingStore().getIndirectIncoming(account.getId(), transactionId);

    if (indirect == null) {
      return UNKNOWN_TRANSACTION;
    }
    return JSONData.indirect(indirect, blockchain.getHeight());

  }

}

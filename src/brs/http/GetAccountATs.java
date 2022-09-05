package brs.http;

import brs.Account;
import brs.BurstException;
import brs.services.ATService;
import brs.services.ParameterService;
import brs.util.Convert;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

import static brs.http.JSONResponses.ERROR_INCORRECT_REQUEST;
import static brs.http.common.Parameters.*;
import static brs.http.common.ResultFields.ATS_RESPONSE;

public final class GetAccountATs extends APIServlet.JsonRequestHandler {

  private final ParameterService parameterService;
  private final ATService atService;

  GetAccountATs(ParameterService parameterService, ATService atService) {
    super(new APITag[] {APITag.AT, APITag.ACCOUNTS}, ACCOUNT_PARAMETER, MACHINE_CODE_HASH_ID_PARAMETER, FIRST_INDEX_PARAMETER, LAST_INDEX_PARAMETER);
    this.parameterService = parameterService;
    this.atService = atService;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {
    Account account = parameterService.getAccount(req);

    int firstIndex = ParameterParser.getFirstIndex(req);
    int lastIndex  = ParameterParser.getLastIndex(req);

    if(lastIndex < firstIndex) {
      throw new IllegalArgumentException("lastIndex must be greater or equal to firstIndex");
    }

    Long codeHashId = null;
    String codeHashIdString = Convert.emptyToNull(req.getParameter(MACHINE_CODE_HASH_ID_PARAMETER));
    if(codeHashIdString != null) {
      try {
        codeHashId = Convert.parseUnsignedLong(codeHashIdString);
      } catch (RuntimeException e) {
        return ERROR_INCORRECT_REQUEST;
      }
    }

    List<Long> atIds = atService.getATsIssuedBy(account.getId(), codeHashId, firstIndex, lastIndex);
    JsonArray ats = new JsonArray();
    for(long atId : atIds) {
      ats.add(JSONData.at(atService.getAT(atId)));
    }

    JsonObject response = new JsonObject();
    response.add(ATS_RESPONSE, ats);
    return response;
  }
}

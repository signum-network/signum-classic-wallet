package brs.http;

import brs.services.ATService;
import brs.util.Convert;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.ResultFields.AT_IDS_RESPONSE;
import static brs.http.JSONResponses.ERROR_INCORRECT_REQUEST;
import static brs.http.common.Parameters.MACHINE_CODE_HASH_ID_PARAMETER;

final class GetATIds extends APIServlet.JsonRequestHandler {

  private final ATService atService;

  GetATIds(ATService atService) {
    super(new APITag[] {APITag.AT}, MACHINE_CODE_HASH_ID_PARAMETER);
    this.atService = atService;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) {
    
    Long codeHashId = null;
    String codeHashIdString = Convert.emptyToNull(req.getParameter(MACHINE_CODE_HASH_ID_PARAMETER));
    if(codeHashIdString != null) {
      try {
        codeHashId = Convert.parseUnsignedLong(codeHashIdString);
      } catch (RuntimeException e) {
        return ERROR_INCORRECT_REQUEST;
      }
    }

    JsonArray atIds = new JsonArray();
    for (Long id : atService.getAllATIds(codeHashId)) {
      atIds.add(Convert.toUnsignedLong(id));
    }

    JsonObject response = new JsonObject();
    response.add(AT_IDS_RESPONSE, atIds);
    return response;
  }

}

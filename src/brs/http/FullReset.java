package brs.http;

import brs.BlockchainProcessor;
import brs.props.PropertyService;
import brs.props.Props;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.JSONResponses.ERROR_NOT_ALLOWED;
import static brs.http.common.Parameters.API_KEY_PARAMETER;
import static brs.http.common.ResultFields.DONE_RESPONSE;
import static brs.http.common.ResultFields.ERROR_RESPONSE;

import java.util.List;

public final class FullReset extends APIServlet.JsonRequestHandler {

  private final BlockchainProcessor blockchainProcessor;
  
  private final List<String> apiAdminKeyList;

  FullReset(BlockchainProcessor blockchainProcessor, PropertyService propertyService) {
    super(new APITag[]{APITag.ADMIN}, API_KEY_PARAMETER);
    this.blockchainProcessor = blockchainProcessor;
    
    apiAdminKeyList = propertyService.getStringList(Props.API_ADMIN_KEY_LIST);
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) {
    String apiKey = req.getParameter(API_KEY_PARAMETER);
    if(!apiAdminKeyList.contains(apiKey)) {
      return ERROR_NOT_ALLOWED;
    }
    
    JsonObject response = new JsonObject();
    try {
      blockchainProcessor.fullReset();
      response.addProperty(DONE_RESPONSE, true);
    } catch (RuntimeException e) {
      response.addProperty(ERROR_RESPONSE, e.toString());
    }
    return response;
  }

  @Override
  final boolean requirePost() {
    return true;
  }

}

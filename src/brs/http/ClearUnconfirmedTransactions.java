package brs.http;

import brs.TransactionProcessor;
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

public final class ClearUnconfirmedTransactions extends APIServlet.JsonRequestHandler {

  private final TransactionProcessor transactionProcessor;
  
  private final List<String> apiAdminKeyList;

  ClearUnconfirmedTransactions(TransactionProcessor transactionProcessor, PropertyService propertyService) {
    super(new APITag[]{APITag.ADMIN}, API_KEY_PARAMETER);
    this.transactionProcessor = transactionProcessor;
    
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
      transactionProcessor.clearUnconfirmedTransactions();
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

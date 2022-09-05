package brs.http;

import static brs.http.common.Parameters.FILENAME_PARAMETER;
import static brs.http.JSONResponses.ERROR_NOT_ALLOWED;
import static brs.http.common.Parameters.API_KEY_PARAMETER;
import static brs.http.common.ResultFields.ERROR_RESPONSE;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import brs.db.sql.Db;
import brs.props.PropertyService;
import brs.props.Props;

final class BackupDB extends APIServlet.JsonRequestHandler {

  private final List<String> apiAdminKeyList;

  BackupDB(PropertyService propertyService) {
    super(new APITag[] {APITag.ADMIN}, FILENAME_PARAMETER, API_KEY_PARAMETER);
    
    apiAdminKeyList = propertyService.getStringList(Props.API_ADMIN_KEY_LIST);
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) {

    JsonObject response = new JsonObject();
    String filename = req.getParameter(FILENAME_PARAMETER);
    String apiKey = req.getParameter(API_KEY_PARAMETER);
    
    if(!apiAdminKeyList.contains(apiKey)) {
      return ERROR_NOT_ALLOWED;
    }

    if(filename == null || filename.length() == 0) {
      response.addProperty(ERROR_RESPONSE, "invalid filename");
      return response;
    }
    
    Db.backup(filename);
    
    return response;
  }
  
  @Override
  final boolean requirePost() {
    return true;
  }

}

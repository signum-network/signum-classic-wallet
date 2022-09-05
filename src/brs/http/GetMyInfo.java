package brs.http;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.UUID;

import javax.servlet.http.HttpServletRequest;

final class GetMyInfo extends APIServlet.JsonRequestHandler {

  static final GetMyInfo instance = new GetMyInfo();
  
  private final String uuid;

  private GetMyInfo() {
    super(new APITag[] {APITag.INFO});
    
    uuid = UUID.randomUUID().toString();
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) {

    JsonObject response = new JsonObject();
    response.addProperty("host", req.getRemoteHost());
    response.addProperty("address", req.getRemoteAddr());
    response.addProperty("UUID", uuid);
    return response;
  }

}

package brs.http;

import brs.TransactionProcessor;
import brs.common.QuickMocker;
import brs.props.PropertyService;
import brs.props.Props;
import brs.util.JSON;
import com.google.gson.JsonObject;
import org.junit.Before;
import org.junit.Test;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.API_KEY_PARAMETER;
import static brs.http.common.ResultFields.DONE_RESPONSE;
import static brs.http.common.ResultFields.ERROR_RESPONSE;
import static brs.http.common.ResultFields.ERROR_CODE_RESPONSE;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

import java.util.ArrayList;

public class ClearUnconfirmedTransactionsTest {

  private ClearUnconfirmedTransactions t;

  private TransactionProcessor transactionProcessorMock;
  private PropertyService propertyService;
  
  private static final String KEY = "abc";

  @Before
  public void init() {
    transactionProcessorMock = mock(TransactionProcessor.class);
    propertyService = mock(PropertyService.class);
    
    ArrayList<String> keys = new ArrayList<>();
    keys.add(KEY);
    doReturn(keys).when(propertyService).getStringList(Props.API_ADMIN_KEY_LIST);

    this.t = new ClearUnconfirmedTransactions(transactionProcessorMock, propertyService);
  }

  @Test
  public void processRequest() {
    final HttpServletRequest req = QuickMocker.httpServletRequest();
    
    doReturn(KEY).when(req).getParameter(API_KEY_PARAMETER);

    final JsonObject result = ((JsonObject) t.processRequest(req));

    assertEquals(true, JSON.getAsBoolean(result.get(DONE_RESPONSE)));
  }
  
  @Test
  public void processRequestNotAllowed() {
    final HttpServletRequest req = QuickMocker.httpServletRequest();
    
    doReturn("").when(req).getParameter(API_KEY_PARAMETER);

    final JsonObject result = ((JsonObject) t.processRequest(req));

    assertEquals(7, JSON.getAsInt(result.get(ERROR_CODE_RESPONSE)));
  }

  @Test
  public void processRequest_runtimeExceptionOccurs() {
    final HttpServletRequest req = QuickMocker.httpServletRequest();
    
    doReturn(KEY).when(req).getParameter(API_KEY_PARAMETER);

    doThrow(new RuntimeException("errorMessage")).when(transactionProcessorMock).clearUnconfirmedTransactions();

    final JsonObject result = ((JsonObject) t.processRequest(req));

    assertEquals("java.lang.RuntimeException: errorMessage", JSON.getAsString(result.get(ERROR_RESPONSE)));
  }

  @Test
  public void requirePost() {
    assertTrue(t.requirePost());
  }
}
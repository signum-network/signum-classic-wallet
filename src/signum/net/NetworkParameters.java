package signum.net;

import java.util.Map;

import brs.Transaction;
import brs.TransactionType;
import brs.http.APITransactionManager;
import brs.http.APIServlet.HttpRequestHandler;
import brs.services.AccountService;
import brs.services.ParameterService;

public interface NetworkParameters {
  
  void initialize(ParameterService parameterService, AccountService accountService,
      APITransactionManager apiTransactionManager);
  
  String getProperty(String key);
  
  /**
   * This method can either add or remove transaction types/subtyes on the given map.
   */
  void adjustTransactionTypes(Map<TransactionType.Type, Map<Byte, TransactionType>> types);
  
  /**
   * This method can either add or remove API requests from the given map.
   */
  void adjustAPIs(Map<String, HttpRequestHandler> map);

  /**
   * @param height
   * @return the block reward distribution in per thousand for the given account IDs
   */
  Map<Long, Integer> getBlockRewardDistribution(int height);
  
  /**
   * A new unconfirmed transaction was added to the mempool
   * 
   * @param transaction
   */
  void unconfirmedTransactionAdded(Transaction transaction);
  
  /**
   * A new unconfirmed transaction was removed from the mempool (either expired or confirmed)
   * 
   * @param transaction
   */
  void unconfirmedTransactionRemoved(Transaction transaction);

  /**
   * A new transaction was applied (due to a block being applied)
   * 
   * @param transaction
   */
  void transactionApplied(Transaction transaction);

}

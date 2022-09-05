package brs.services;

import brs.BurstException;
import brs.Transaction;

public interface TransactionService {

  boolean verifyPublicKey(Transaction transaction);

  void validate(Transaction transaction) throws BurstException.ValidationException;
  
  void startNewBlock();

  boolean applyUnconfirmed(Transaction transaction);

  void apply(Transaction transaction);

  void undoUnconfirmed(Transaction transaction);
}

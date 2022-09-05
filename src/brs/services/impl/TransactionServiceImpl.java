package brs.services.impl;

import java.util.HashMap;

import brs.*;
import brs.services.AccountService;
import brs.services.TransactionService;

public class TransactionServiceImpl implements TransactionService {

  private final AccountService accountService;
  private final Blockchain blockchain;
  private final HashMap<Long, Transaction> accountCommitmentRemovals = new HashMap<>();

  public TransactionServiceImpl(AccountService accountService, Blockchain blockchain) {
    this.accountService = accountService;
    this.blockchain = blockchain;
  }

  @Override
  public boolean verifyPublicKey(Transaction transaction) {
    Account account = accountService.getAccount(transaction.getSenderId());
    if (account == null) {
      return false;
    }
    if (transaction.getSignature() == null) {
      return false;
    }
    return account.setOrVerify(transaction.getSenderPublicKey(), transaction.getHeight());
  }

  @Override
  public void validate(Transaction transaction) throws BurstException.ValidationException {
    for (Appendix.AbstractAppendix appendage : transaction.getAppendages()) {
      appendage.validate(transaction);
    }
    long minimumFeeNQT = transaction.getType().minimumFeeNQT(blockchain.getHeight(), transaction);
    if (transaction.getFeeNQT() < minimumFeeNQT) {
      throw new BurstException.NotCurrentlyValidException(String.format("Transaction fee %d less than minimum fee %d at height %d",
          transaction.getFeeNQT(), minimumFeeNQT, blockchain.getHeight()));
    }
  }
  
  @Override
  public void startNewBlock() {
    accountCommitmentRemovals.clear();
  }

  @Override
  public boolean applyUnconfirmed(Transaction transaction) {
    if(transaction.getType() == TransactionType.BurstMining.COMMITMENT_REMOVE) {
      // we only accept one removal per account per block
      if(accountCommitmentRemovals.get(transaction.getSenderId()) != null)
        return false;
      accountCommitmentRemovals.put(transaction.getSenderId(), transaction);
    }
    Account senderAccount = accountService.getAccount(transaction.getSenderId());
    return senderAccount != null && transaction.getType().applyUnconfirmed(transaction, senderAccount);
  }

  @Override
  public void apply(Transaction transaction) {
    Account senderAccount = accountService.getAccount(transaction.getSenderId());
    senderAccount.apply(transaction.getSenderPublicKey(), transaction.getHeight());
    Account recipientAccount = accountService.getOrAddAccount(transaction.getRecipientId());
    for (Appendix.AbstractAppendix appendage : transaction.getAppendages()) {
      appendage.apply(transaction, senderAccount, recipientAccount);
    }
  }

  @Override
  public void undoUnconfirmed(Transaction transaction) {
    final Account senderAccount = accountService.getAccount(transaction.getSenderId());
    transaction.getType().undoUnconfirmed(transaction, senderAccount);
  }

}

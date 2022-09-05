package brs;

import brs.crypto.Crypto;
import brs.crypto.EncryptedData;
import brs.db.BurstKey;
import brs.db.VersionedBatchEntityTable;
import brs.util.Convert;

import java.util.logging.Level;
import java.util.logging.Logger;

public class Account {

  private static final Logger logger = Logger.getLogger(Account.class.getSimpleName());

  public final long id;
  public final BurstKey nxtKey;
  private final int creationHeight;
  private byte[] publicKey;
  private int keyHeight;

  protected String name;
  protected String description;
  
  public static class Balance {
    public final long id;
    public final BurstKey nxtKey;

    protected long balanceNQT;
    protected long unconfirmedBalanceNQT;
    protected long forgedBalanceNQT;
    
    public Balance(long id) {
      this.id = id;
      this.nxtKey = accountBurstKeyFactory().newKey(this.id);
    }
    
    public void setForgedBalanceNQT(long forgedBalanceNQT) {
      this.forgedBalanceNQT = forgedBalanceNQT;
    }

    public void setUnconfirmedBalanceNQT(long unconfirmedBalanceNQT) {
      this.unconfirmedBalanceNQT = unconfirmedBalanceNQT;
    }

    public void setBalanceNQT(long balanceNQT) {
      this.balanceNQT = balanceNQT;
    }
    
    public long getId() {
      return id;
    }

    public long getBalanceNQT() {
      return balanceNQT;
    }

    public long getUnconfirmedBalanceNQT() {
      return unconfirmedBalanceNQT;
    }

    public long getForgedBalanceNQT() {
      return forgedBalanceNQT;
    }
    
    public void checkBalance() {
      Account.checkBalance(this.id, this.balanceNQT, this.unconfirmedBalanceNQT);
    }

  }

  public void setName(String name) {
    this.name = name;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public void setPublicKey(byte[] publicKey) {
    this.publicKey = publicKey;
  }

  public void setKeyHeight(int keyHeight) {
    this.keyHeight = keyHeight;
  }

  public enum Event {
    BALANCE, UNCONFIRMED_BALANCE, ASSET_BALANCE, UNCONFIRMED_ASSET_BALANCE,
    LEASE_SCHEDULED, LEASE_STARTED, LEASE_ENDED

  }

  public static class AccountAsset {
    public final long accountId;
    public final long assetId;
    public final BurstKey burstKey;
    private long quantityQNT;
    private long unconfirmedQuantityQNT;

    protected AccountAsset(long accountId, long assetId, long quantityQNT, long unconfirmedQuantityQNT, BurstKey burstKey) {
      this.accountId = accountId;
      this.assetId = assetId;
      this.quantityQNT = quantityQNT;
      this.unconfirmedQuantityQNT = unconfirmedQuantityQNT;
      this.burstKey = burstKey;
    }

    public AccountAsset(BurstKey burstKey, long accountId, long assetId, long quantityQNT, long unconfirmedQuantityQNT) {
      this.accountId = accountId;
      this.assetId = assetId;
      this.burstKey = burstKey;
      this.quantityQNT = quantityQNT;
      this.unconfirmedQuantityQNT = unconfirmedQuantityQNT;
    }

    public long getAccountId() {
      return accountId;
    }

    public long getAssetId() {
      return assetId;
    }

    public long getQuantityQNT() {
      return quantityQNT;
    }

    public long getUnconfirmedQuantityQNT() {
      return unconfirmedQuantityQNT;
    }

    public void checkBalance() {
      Account.checkBalance(this.accountId, this.quantityQNT, this.unconfirmedQuantityQNT);
    }

    @Override
    public String toString() {
      return "AccountAsset account_id: "
          + Convert.toUnsignedLong(accountId)
          + " asset_id: "
          + Convert.toUnsignedLong(assetId)
          + " quantity: "
          + quantityQNT
          + " unconfirmedQuantity: "
          + unconfirmedQuantityQNT;
    }

    public void setQuantityQNT(long quantityQNT) {
      this.quantityQNT = quantityQNT;
    }

    public void setUnconfirmedQuantityQNT(long unconfirmedQuantityQNT) {
      this.unconfirmedQuantityQNT = unconfirmedQuantityQNT;
    }
  }

  public static class RewardRecipientAssignment {
    public final Long accountId;
    private Long prevRecipientId;
    private Long recipientId;
    private int fromHeight;
    public final BurstKey burstKey;

    public RewardRecipientAssignment(Long accountId, Long prevRecipientId, Long recipientId, int fromHeight, BurstKey burstKey) {
      this.accountId = accountId;
      this.prevRecipientId = prevRecipientId;
      this.recipientId = recipientId;
      this.fromHeight = fromHeight;
      this.burstKey = burstKey;
    }

    public long getAccountId() {
      return accountId;
    }

    public long getPrevRecipientId() {
      return prevRecipientId;
    }

    public long getRecipientId() {
      return recipientId;
    }

    public int getFromHeight() {
      return fromHeight;
    }
    public void setRecipient(long newRecipientId, int fromHeight) {
      prevRecipientId = recipientId;
      recipientId = newRecipientId;
      this.fromHeight = fromHeight;
    }
  }

  static class DoubleSpendingException extends RuntimeException {

    DoubleSpendingException(String message) {
      super(message);
    }

  }

  private static BurstKey.LongKeyFactory<Account> accountBurstKeyFactory() {
    return Burst.getStores().getAccountStore().getAccountKeyFactory();
  }

  private static BurstKey.LongKeyFactory<Account.Balance> accountBalanceBurstKeyFactory() {
    return Burst.getStores().getAccountStore().getAccountBalanceKeyFactory();
  }

  private static VersionedBatchEntityTable<Account> accountTable() {
    return Burst.getStores().getAccountStore().getAccountTable();
  }
  
  private static VersionedBatchEntityTable<Account.Balance> accountBalanceTable() {
    return Burst.getStores().getAccountStore().getAccountBalanceTable();
  }

  public static Account getAccount(long id) {
    return id == 0 ? null : accountTable().get(accountBurstKeyFactory().newKey(id));
  }
  
  public static Account.Balance getAccountBalance(long id) {
    return id == 0 ? null : accountBalanceTable().get(accountBalanceBurstKeyFactory().newKey(id));
  }

  public static long getId(byte[] publicKey) {
    byte[] publicKeyHash = Crypto.sha256().digest(publicKey);
    return Convert.fullHashToId(publicKeyHash);
  }

  public static Account getOrAddAccount(long id) {
    Account account = getAccount(id);
    if (account == null) {
      account = new Account(id);
      accountTable().insert(account);
    }
    return account;
  }

  public Account(long id) {
    if (id != Crypto.rsDecode(Crypto.rsEncode(id))) {
      logger.log(Level.INFO, "CRITICAL ERROR: Reed-Solomon encoding fails for {0}", id);
    }
    this.id = id;
    this.nxtKey = accountBurstKeyFactory().newKey(this.id);
    this.creationHeight = Burst.getBlockchain().getHeight();
  }

  protected Account(long id, BurstKey burstKey, int creationHeight) {
    if (id != Crypto.rsDecode(Crypto.rsEncode(id))) {
      logger.log(Level.INFO, "CRITICAL ERROR: Reed-Solomon encoding fails for {0}", id);
    }
    this.id = id;
    this.nxtKey = burstKey;
    this.creationHeight = creationHeight;
  }

  public long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public byte[] getPublicKey() {
    if (this.keyHeight == -1) {
      return null;
    }
    return publicKey;
  }

  public int getCreationHeight() {
    return creationHeight;
  }

  public int getKeyHeight() {
    return keyHeight;
  }
  
  public long getUnconfirmedBalanceNQT() {
    return Account.getAccountBalance(id).getUnconfirmedBalanceNQT();
  }
  
  public long getBalanceNQT() {
    return Account.getAccountBalance(id).getBalanceNQT();
  }

  public long getForgedBalanceNQT() {
    return Account.getAccountBalance(id).getForgedBalanceNQT();
  }

  public EncryptedData encryptTo(byte[] data, String senderSecretPhrase) {
    if (getPublicKey() == null) {
      throw new IllegalArgumentException("Recipient account doesn't have a public key set");
    }
    return EncryptedData.encrypt(data, Crypto.getPrivateKey(senderSecretPhrase), publicKey);
  }

  public static EncryptedData encryptTo(byte[] data, String senderSecretPhrase, byte[] publicKey) {
    if (publicKey == null) {
      throw new IllegalArgumentException("public key required");
    }
    return EncryptedData.encrypt(data, Crypto.getPrivateKey(senderSecretPhrase), publicKey);
  }


  public byte[] decryptFrom(EncryptedData encryptedData, String recipientSecretPhrase) {
    if (getPublicKey() == null) {
      throw new IllegalArgumentException("Sender account doesn't have a public key set");
    }
    return encryptedData.decrypt(Crypto.getPrivateKey(recipientSecretPhrase), publicKey);
  }

  // returns true iff:
  // this.publicKey is set to null (in which case this.publicKey also gets set to key)
  // or
  // this.publicKey is already set to an array equal to key
  public boolean setOrVerify(byte[] key, int height) {
    return Burst.getStores().getAccountStore().setOrVerify(this, key, height);
  }

  public void apply(byte[] key, int height) {
    if (!setOrVerify(key, this.creationHeight)) {
      throw new IllegalStateException("Public key mismatch");
    }
    if (this.publicKey == null) {
      throw new IllegalStateException("Public key has not been set for account " + Convert.toUnsignedLong(id)
          + " at height " + height + ", key height is " + keyHeight);
    }
    if (this.keyHeight == -1 || this.keyHeight > height) {
      this.keyHeight = height;
      accountTable().insert(this);
    }
  }

  private static void checkBalance(long accountId, long confirmed, long unconfirmed) {
    if (confirmed < 0) {
      throw new DoubleSpendingException("Negative balance or quantity ("
                                        + confirmed
                                        + ") for account "
                                        + Convert.toUnsignedLong(accountId));
    }
    if (unconfirmed < 0) {
      throw new DoubleSpendingException("Negative unconfirmed balance or quantity ("
                                        + unconfirmed
                                        + ") for account "
                                        + Convert.toUnsignedLong(accountId));
    }
    if (unconfirmed > confirmed) {
      throw new DoubleSpendingException("Unconfirmed ("
                                        + unconfirmed
                                        + ") exceeds confirmed ("
                                        + confirmed
                                        + ") balance or quantity for account "
                                        + Convert.toUnsignedLong(accountId));
    }
  }

}

/*
 * Copyright (c) 2014 CIYAM Developers

 Distributed under the MIT/X11 software license, please refer to the file license.txt
 in the root project directory or http://www.opensource.org/licenses/mit-license.php.
*/

package brs.at;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Collection;
import java.util.SortedMap;
import java.util.TreeMap;

import brs.Account;
import brs.Appendix;
import brs.Asset;
import brs.Attachment;
import brs.Block;
import brs.Burst;
import brs.BurstException.NotValidException;
import brs.Constants;
import brs.Genesis;
import brs.IndirectIncoming;
import brs.Transaction;
import brs.TransactionType;
import brs.crypto.Crypto;
import brs.fluxcapacitor.FluxValues;
import brs.Attachment.ColoredCoinsAssetIssuance;
import brs.Attachment.ColoredCoinsAssetTransfer;
import brs.services.AccountService;
import brs.util.Convert;
import brs.util.TextUtils;

public class AtTransaction {
    private static final SortedMap<Long, SortedMap<Long, AtTransaction>> all_AT_Txs = new TreeMap<>();
    private final byte[] message;
    private final long amount;
    private final long assetId;
    private final long quantity;
    private final long assetIdToDistribute;
    private final long minHolding;
    private byte[] senderId;
    private byte[] recipientId;
    private TransactionType type;
    private Attachment.AbstractAttachment attachment;

    AtTransaction(TransactionType type, byte[] senderId, byte[] recipientId, long amount, byte[] message) {
      this(type, senderId, recipientId, amount, 0L, 0L, 0L, 0L, message);
    }

    AtTransaction(TransactionType type, byte[] senderId, byte[] recipientId, long amount, long assetId, long quantity, byte[] message) {
      this(type, senderId, recipientId, amount, assetId, quantity, 0L, 0L, message);
    }

    AtTransaction(TransactionType type, byte[] senderId, byte[] recipientId, long amount, long assetId, long quantity, long assetIdToDistribute,
      long minHolding, byte[] message) {
        this.senderId = senderId.clone();
        this.recipientId = recipientId==null ? null : recipientId.clone();
        this.amount = amount;
        this.quantity = quantity;
        this.assetIdToDistribute = assetIdToDistribute;
        this.minHolding = minHolding;
        this.message = (message != null) ? message.clone() : null;
        this.type = type;

        if (getType() == TransactionType.ColoredCoins.ASSET_ISSUANCE) {
          // create an asset ID, not using here the transaction id (as usual) because we don't have it yet
          ByteBuffer buffer = ByteBuffer.allocate(getSenderId().length + getMessage().length);
          buffer.order(ByteOrder.LITTLE_ENDIAN);
          buffer.put(getSenderId());
          buffer.put(getMessage());
          byte[] fullHash = Crypto.sha256().digest(buffer.array());
          this.assetId = Convert.fullHashToId(fullHash);
        }
        else {
          this.assetId = assetId;
        }
    }

    public Transaction build(Block block) throws NotValidException {
      attachment = Attachment.AT_PAYMENT;

      long recipient = getRecipientId() == null ? 0L : AtApiHelper.getLong(getRecipientId());

      if (getType() == TransactionType.ColoredCoins.ASSET_TRANSFER) {
        attachment = new Attachment.ColoredCoinsAssetTransfer(getAssetId(),
            quantity, block.getHeight());
      }
      else if (getType() == TransactionType.ColoredCoins.ASSET_ISSUANCE) {
        String name = Convert.toString(getMessage()).trim();
        if(name.length() > Constants.MAX_ASSET_NAME_LENGTH) {
          name = name.substring(0, Constants.MAX_ASSET_NAME_LENGTH);
        }
        if (!TextUtils.isInAlphabet(name)) {
          name = "UNNAMED";
        }
        long decimals = quantity;
        if(decimals < 0 || decimals > 8) {
          decimals = 4;
        }

        attachment = new Attachment.ColoredCoinsAssetIssuance(name, "Token issued and controlled by smart contract ID: " + Convert.toUnsignedLong(AtApiHelper.getLong(getSenderId()))
            , 0L, (byte)decimals, block.getHeight(), true);
      }
      else if (getType() == TransactionType.ColoredCoins.ASSET_MINT) {
        attachment = new Attachment.ColoredCoinsAssetMint(getAssetId(), quantity, block.getHeight());
      }
      else if (getType() == TransactionType.ColoredCoins.ASSET_DISTRIBUTE_TO_HOLDERS) {
        attachment = new Attachment.ColoredCoinsAssetDistributeToHolders(assetId, minHolding, assetIdToDistribute, quantity, block.getHeight());
      }

      Transaction.Builder builder = new Transaction.Builder((byte) 1, Genesis.getCreatorPublicKey(),
          amount, 0L, block.getTimestamp(), (short) 1440, attachment);

      builder.senderId(AtApiHelper.getLong(getSenderId()))
              .recipientId(recipient)
              .blockId(block.getId())
              .height(block.getHeight())
              .blockTimestamp(block.getTimestamp())
              .ecBlockHeight(0)
              .ecBlockId(0L);

      byte[] message = getMessage();
      if (message != null) {
          builder.message(new Appendix.Message(message, Burst.getBlockchain().getHeight()));
      }

      return builder.build();
    }

    public void apply(AccountService accountService, Transaction transaction) {
      Account senderAccount = accountService.getAccount(AtApiHelper.getLong(getSenderId()));
      long recipient = getRecipientId() == null ? 0L : AtApiHelper.getLong(getRecipientId());
      Account recipientAccount = accountService.getOrAddAccount(recipient);

      if (getType() == TransactionType.ColoredCoins.ASSET_TRANSFER) {
        accountService.addToAssetAndUnconfirmedAssetBalanceQNT(senderAccount, getAssetId(), -quantity);
        accountService.addToAssetAndUnconfirmedAssetBalanceQNT(recipientAccount, getAssetId(), quantity);

        ColoredCoinsAssetTransfer assetTransferAttachment = (ColoredCoinsAssetTransfer) attachment;
        Burst.getAssetExchange().addAssetTransfer(transaction, assetTransferAttachment.getAssetId(), assetTransferAttachment.getQuantityQNT());

        // we also have coins to send besides the asset
        if(getAmount() > 0L && Burst.getFluxCapacitor().getValue(FluxValues.AT_FIX_BLOCK_5, transaction.getHeight())) {
          accountService.addToBalanceAndUnconfirmedBalanceNQT(senderAccount, -getAmount());
          accountService.addToBalanceAndUnconfirmedBalanceNQT(recipientAccount, getAmount());
        }
      }
      else if (getType() == TransactionType.ColoredCoins.ASSET_ISSUANCE) {
        Asset asset = Burst.getAssetExchange().getAsset(assetId);
        if(asset == null && assetId != 0L) {
          Burst.getAssetExchange().addAsset(assetId, senderAccount.getId(), (ColoredCoinsAssetIssuance) attachment);
        }
      }
      else if (getType() == TransactionType.ColoredCoins.ASSET_MINT) {
        accountService.addToAssetAndUnconfirmedAssetBalanceQNT(senderAccount, getAssetId(), quantity);
      }
      else if (getType() == TransactionType.ColoredCoins.ASSET_DISTRIBUTE_TO_HOLDERS) {
        accountService.addToBalanceAndUnconfirmedBalanceNQT(senderAccount, -getAmount());
        if(assetIdToDistribute != 0L){
          accountService.addToAssetAndUnconfirmedAssetBalanceQNT(senderAccount, assetIdToDistribute, -quantity);
        }

        Collection<IndirectIncoming> indirects = attachment.getTransactionType().getIndirectIncomings(transaction);

        if(indirects.isEmpty()){
          // revert, since we are not distributing
          accountService.addToBalanceAndUnconfirmedBalanceNQT(senderAccount, getAmount());
          if(assetIdToDistribute != 0L){
            accountService.addToAssetAndUnconfirmedAssetBalanceQNT(senderAccount, assetIdToDistribute, quantity);
          }
        }
        else {
          for(IndirectIncoming incoming : indirects){
            Account indirecRecipient = accountService.getOrAddAccount(incoming.getAccountId());
            if(incoming.getAmount() > 0L){
              accountService.addToBalanceAndUnconfirmedBalanceNQT(indirecRecipient, incoming.getAmount());
            }
            if(this.assetIdToDistribute != 0L){
              accountService.addToAssetAndUnconfirmedAssetBalanceQNT(indirecRecipient, assetIdToDistribute, incoming.getQuantity());
            }
          }
          Burst.getStores().getIndirectIncomingStore().addIndirectIncomings(indirects);
        }
      }
      else {
        accountService.addToBalanceAndUnconfirmedBalanceNQT(senderAccount, -getAmount());
        accountService.addToBalanceAndUnconfirmedBalanceNQT(recipientAccount, getAmount());
      }

    }

    public static AtTransaction getATTransaction(Long atId, Long height) {
        if (all_AT_Txs.containsKey(atId)) {
            return all_AT_Txs.get(atId).get(height);
        }

        return null;
    }

    public long getAmount() {
        return amount;
    }

    public long getQuantity() {
      return quantity;
    }

    public TransactionType getType() {
      return type;
    }

    public long getAssetId() {
      return assetId;
    }

    public byte[] getSenderId() {
        return senderId;
    }

    public byte[] getRecipientId() {
        return recipientId;
    }

    public byte[] getMessage() {
        return message;
    }

    public void addTransaction(long atId, Long height) {
        if (all_AT_Txs.containsKey(atId)) {
            all_AT_Txs.get(atId).put(height, this);
        } else {
            SortedMap<Long, AtTransaction> temp = new TreeMap<>();
            temp.put(height, this);
            all_AT_Txs.put(atId, temp);
        }
    }
}

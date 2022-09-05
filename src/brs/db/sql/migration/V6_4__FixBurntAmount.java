package brs.db.sql.migration;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import brs.Attachment.PaymentMultiOutCreation;
import brs.Attachment.PaymentMultiSameOutCreation;
import brs.TransactionType;

public class V6_4__FixBurntAmount extends BaseJavaMigration {
  
  public void migrate(Context context) throws Exception {
    long totalBurnt = 0L;
    
    // ordinary tx burns
    try (Statement selectTx = context.getConnection().createStatement()) {
      try (ResultSet txResult = selectTx.executeQuery("SELECT amount FROM transaction WHERE type=0 and subtype=0 and (recipient_id=0 or recipient_id IS NULL)")) {
        while (txResult.next()) {
          long amountNQT = txResult.getLong(1);
          totalBurnt += amountNQT;
        }
      }
    }
    
    // smart contract tx burns
    try (Statement selectTx = context.getConnection().createStatement()) {
      try (ResultSet txResult = selectTx.executeQuery("SELECT amount FROM transaction WHERE type=22 and subtype=1 and (recipient_id=0 or recipient_id IS NULL)")) {
        while (txResult.next()) {
          long amountNQT = txResult.getLong(1);
          totalBurnt += amountNQT;
        }
      }
    }
    
    // multi-out burns
    try (Statement select = context.getConnection().createStatement()) {
      try (ResultSet rows = select.executeQuery("SELECT transaction_id FROM indirect_incoming WHERE account_id=0")) {
        while (rows.next()) {
          long tx_id = rows.getLong(1);
          
          try (Statement selectTx = context.getConnection().createStatement()) {
            try (ResultSet txResult = selectTx.executeQuery("SELECT attachment_bytes, subtype, version, amount FROM transaction WHERE id=" + tx_id)) {
              while (txResult.next()) {
                byte[] attachment_bytes = txResult.getBytes(1);
                byte subtype = txResult.getByte(2);
                byte version = txResult.getByte(3);
                long amountNQT = txResult.getLong(4);
                
                ByteBuffer buffer = ByteBuffer.wrap(attachment_bytes);
                buffer.order(ByteOrder.LITTLE_ENDIAN);
                
                if(subtype == 1) {
                  // multi-out
                  PaymentMultiOutCreation multiOut = (PaymentMultiOutCreation) TransactionType.Payment.MULTI_OUT.parseAttachment(buffer, version);
                  for (List<Long> recipient : multiOut.getRecipients()) {
                    if(recipient.get(0) == 0L)
                      totalBurnt += recipient.get(1);
                  }
                }
                else if(subtype == 2) {
                  // multi-out same
                  PaymentMultiSameOutCreation multiOut = (PaymentMultiSameOutCreation) TransactionType.Payment.MULTI_SAME_OUT.parseAttachment(buffer, version);
                  for (Long recipient : multiOut.getRecipients()) {
                    if(recipient == 0L)
                      totalBurnt += amountNQT/multiOut.getRecipients().size();
                  }
                }
              }
            }
          }
        }
      }
    }
    
    if(totalBurnt > 0L) {
      // Update to the correct burnt amount
      try (Statement update = context.getConnection().createStatement()) {
        update.execute("UPDATE account SET balance=" + totalBurnt + ", unconfirmed_balance=" + totalBurnt + " WHERE id=0 AND latest=1");
      }
    }
  }
}

package brs.db.sql.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import brs.crypto.Crypto;
import brs.util.Convert;

import java.sql.ResultSet;
import java.sql.Statement;

public class V5_1__GenerateAtHashes extends BaseJavaMigration {
  
  public void migrate(Context context) throws Exception {
    try (Statement select = context.getConnection().createStatement()) {
      try (ResultSet rows = select.executeQuery("SELECT id,ap_code FROM at ORDER BY id")) {
        while (rows.next()) {
          long id = rows.getLong(1);
          byte[] gzipCode = rows.getBytes(2);
          byte[] apCode = brs.at.AT.decompressState(gzipCode);
          
          byte[] atCodeHash = Crypto.sha256().digest(apCode);
          long atCodeHashId = Convert.fullHashToId(atCodeHash);
          
          try (Statement update = context.getConnection().createStatement()) {
            update.execute("UPDATE at SET ap_code_hash_id=" + atCodeHashId + " WHERE id=" + id);
          }
        }
      }
    }
  }
}

package brs.db.sql.migration;

import java.sql.Statement;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V7_3__MigrateBalances extends BaseJavaMigration {

  public void migrate(Context context) throws Exception {
    // copy all balance entries
    Statement selectTx = context.getConnection().createStatement();
    selectTx.executeUpdate(
      "INSERT INTO account_balance(id, balance, unconfirmed_balance, forged_balance, height, latest) " +
      "SELECT id, balance, unconfirmed_balance, forged_balance, height, latest FROM account"
      );
  }
}

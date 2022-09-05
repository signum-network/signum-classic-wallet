/*
 * Copyright (c) 2014 CIYAM Developers

 Distributed under the MIT/X11 software license, please refer to the file license.txt
 in the root project directory or http://www.opensource.org/licenses/mit-license.php.
*/

package brs.at;

final class OpCode {
    private OpCode() {
    }

    static final byte E_OP_CODE_NOP = Byte.parseByte("7f", 16);
    static final byte E_OP_CODE_SET_VAL = Byte.parseByte("01", 16);
    static final byte E_OP_CODE_SET_DAT = Byte.parseByte("02", 16);
    static final byte E_OP_CODE_CLR_DAT = Byte.parseByte("03", 16);
    static final byte E_OP_CODE_INC_DAT = Byte.parseByte("04", 16);
    static final byte E_OP_CODE_DEC_DAT = Byte.parseByte("05", 16);
    static final byte E_OP_CODE_ADD_DAT = Byte.parseByte("06", 16);
    static final byte E_OP_CODE_SUB_DAT = Byte.parseByte("07", 16);
    static final byte E_OP_CODE_MUL_DAT = Byte.parseByte("08", 16);
    static final byte E_OP_CODE_DIV_DAT = Byte.parseByte("09", 16);
    static final byte E_OP_CODE_BOR_DAT = Byte.parseByte("0a", 16);
    static final byte E_OP_CODE_AND_DAT = Byte.parseByte("0b", 16);
    static final byte E_OP_CODE_XOR_DAT = Byte.parseByte("0c", 16);
    static final byte E_OP_CODE_NOT_DAT = Byte.parseByte("0d", 16);
    static final byte E_OP_CODE_SET_IND = Byte.parseByte("0e", 16);
    static final byte E_OP_CODE_SET_IDX = Byte.parseByte("0f", 16);
    static final byte E_OP_CODE_PSH_DAT = Byte.parseByte("10", 16);
    static final byte E_OP_CODE_POP_DAT = Byte.parseByte("11", 16);
    static final byte E_OP_CODE_JMP_SUB = Byte.parseByte("12", 16);
    static final byte E_OP_CODE_RET_SUB = Byte.parseByte("13", 16);
    static final byte E_OP_CODE_IND_DAT = Byte.parseByte("14", 16);
    static final byte E_OP_CODE_IDX_DAT = Byte.parseByte("15", 16);
    static final byte E_OP_CODE_MOD_DAT = Byte.parseByte("16", 16);
    static final byte E_OP_CODE_SHL_DAT = Byte.parseByte("17", 16);
    static final byte E_OP_CODE_SHR_DAT = Byte.parseByte("18", 16);
    static final byte E_OP_CODE_POW_DAT = Byte.parseByte("19", 16);
    static final byte E_OP_CODE_JMP_ADR = Byte.parseByte("1a", 16);
    static final byte E_OP_CODE_BZR_DAT = Byte.parseByte("1b", 16);
    static final byte E_OP_CODE_BNZ_DAT = Byte.parseByte("1e", 16);
    static final byte E_OP_CODE_BGT_DAT = Byte.parseByte("1f", 16);
    static final byte E_OP_CODE_BLT_DAT = Byte.parseByte("20", 16);
    static final byte E_OP_CODE_BGE_DAT = Byte.parseByte("21", 16);
    static final byte E_OP_CODE_BLE_DAT = Byte.parseByte("22", 16);
    static final byte E_OP_CODE_BEQ_DAT = Byte.parseByte("23", 16);
    static final byte E_OP_CODE_BNE_DAT = Byte.parseByte("24", 16);
    static final byte E_OP_CODE_SLP_DAT = Byte.parseByte("25", 16);
    static final byte E_OP_CODE_FIZ_DAT = Byte.parseByte("26", 16);
    static final byte E_OP_CODE_STZ_DAT = Byte.parseByte("27", 16);
    static final byte E_OP_CODE_FIN_IMD = Byte.parseByte("28", 16);
    static final byte E_OP_CODE_STP_IMD = Byte.parseByte("29", 16);
    static final byte E_OP_CODE_SLP_IMD = Byte.parseByte("2a", 16);
    static final byte E_OP_CODE_ERR_ADR = Byte.parseByte("2b", 16);
    static final byte E_OP_CODE_MDV_DAT = Byte.parseByte("2c", 16);
    static final byte E_OP_CODE_SET_PCS = Byte.parseByte("30", 16);


    static final byte E_OP_CODE_EXT_FIRST = Byte.parseByte("32", 16);
    static final byte E_OP_CODE_EXT_FUN = Byte.parseByte("32", 16);
    static final byte E_OP_CODE_EXT_FUN_DAT = Byte.parseByte("33", 16);
    static final byte E_OP_CODE_EXT_FUN_DAT_2 = Byte.parseByte("34", 16);
    static final byte E_OP_CODE_EXT_FUN_RET = Byte.parseByte("35", 16);
    static final byte E_OP_CODE_EXT_FUN_RET_DAT = Byte.parseByte("36", 16);
    static final byte E_OP_CODE_EXT_FUN_RET_DAT_2 = Byte.parseByte("37", 16);
    static final byte E_OP_CODE_EXT_LAST = Byte.parseByte("38", 16);

    static final short Get_A1   = 0x0100; // EXT_FUN_RET       sets @addr to A1
    static final short Get_A2   = 0x0101; // EXT_FUN_RET       sets @addr to A2
    static final short Get_A3   = 0x0102; // EXT_FUN_RET       sets @addr to A3
    static final short Get_A4   = 0x0103; // EXT_FUN_RET       sets @addr to A4
    static final short Get_B1   = 0x0104; // EXT_FUN_RET       sets @addr to B1
    static final short Get_B2   = 0x0105; // EXT_FUN_RET       sets @addr to B2
    static final short Get_B3   = 0x0106; // EXT_FUN_RET       sets @addr to B3
    static final short Get_B4   = 0x0107; // EXT_FUN_RET       sets @addr to B4

    static final short Set_A1    = 0x0110; // EXT_FUN_DAT       sets A1 from $addr
    static final short Set_A2    = 0x0111; // EXT_FUN_DAT       sets A2 from $addr
    static final short Set_A3    = 0x0112; // EXT_FUN_DAT       sets A3 from $addr
    static final short Set_A4    = 0x0113; // EXT_FUN_DAT       sets A4 from $addr
    static final short Set_A1_A2 = 0x0114; // EXT_FUN_DAT_2     sets A1 from $addr1 and A2 from $addr2
    static final short Set_A3_A4 = 0x0115; // EXT_FUN_DAT_2     sets A3 from $addr1 and A4 from $addr2
    static final short Set_B1    = 0x0116; // EXT_FUN_DAT       sets B1 from $addr
    static final short Set_B2    = 0x0117; // EXT_FUN_DAT       sets B2 from $addr
    static final short Set_B3    = 0x0118; // EXT_FUN_DAT       sets B3 from $addr
    static final short Set_B4    = 0x0119; // EXT_FUN_DAT       sets B4 from $addr
    static final short Set_B1_B2 = 0x011a; // EXT_FUN_DAT_2     sets B1 from $addr1 and B2 from $addr2
    static final short Set_B3_B4 = 0x011b; // EXT_FUN_DAT_2     sets B3 from $addr1 and B4 from $addr2

    static final short Clear_A          = 0x0120; //  EXT_FUN           sets A to zero (A being A1..4)
    static final short Clear_B          = 0x0121; //  EXT_FUN           sets B to zero (B being B1..4)
    static final short Clear_A_And_B    = 0x0122; //  EXT_FUN           sets both A and B to zero
    static final short Copy_A_From_B    = 0x0123; //  EXT_FUN           copies B into A
    static final short Copy_B_From_A    = 0x0124; //  EXT_FUN           copies A into B
    static final short Check_A_Is_Zero  = 0x0125; //  EXT_FUN_RET       @addr to 1 if A is zero or 0 if it is not (i.e. bool)
    static final short Check_B_Is_Zero  = 0x0126; //  EXT_FUN_RET       @addr to 1 if B is zero of 0 if it is not (i.e. bool)
    static final short Check_A_Equals_B = 0x0127; //  EXT_FUN_RET       @addr to bool if A is equal to B
    static final short Swap_A_and_B     = 0x0128; //  EXT_FUN           swap the values of A and B
    static final short OR_A_with_B      = 0x0129; //  EXT_FUN           sets A to A | B (bitwise OR)
    static final short OR_B_with_A      = 0x012a; //  EXT_FUN           sets B to B | A (bitwise OR)
    static final short AND_A_with_B     = 0x012b; //  EXT_FUN           sets A to A & B (bitwise AND)
    static final short AND_B_with_A     = 0x012c; //  EXT_FUN           sets B to B & A (bitwise AND)
    static final short XOR_A_with_B     = 0x012d; //  EXT_FUN           sets A to A ^ B (bitwise XOR)
    static final short XOR_B_with_A     = 0x012e; //  EXT_FUN           sets B to B ^ A (bitwise XOR)

    static final short MD5_A_TO_B               = 0x0200; //  EXT_FUN           take an MD5 hash of A1..2 and put this is B1..2
    static final short CHECK_MD5_A_WITH_B       = 0x0201; //  EXT_FUN_RET       @addr to bool if MD5 hash of A1..2 matches B1..2
    static final short HASH160_A_TO_B           = 0x0202; //  EXT_FUN           take a RIPEMD160 hash of A1..3 and put this in B1..3
    static final short CHECK_HASH160_A_WITH_B   = 0x0203; //  EXT_FUN_RET       @addr to bool if RIPEMD160 hash of A1..3 matches B1..3
    static final short SHA256_A_To_B            = 0x0204; //  EXT_FUN           take a SHA256 hash of A and put this in B
    static final short CHECK_SHA256_A_WITH_B    = 0x0205; //  EXT_FUN_RET       @addr to bool if SHA256 hash of A matches B
    static final short CHECK_SIG_B_WITH_A       = 0x0206; //  EXT_FUN_RET       @addr to bool if [AT ID, B2..4] signature can be verified with the message attached on tx id in A1 (page in A2) for account id in A3

    static final short GET_BLOCK_TIMESTAMP       = 0x0300; // EXT_FUN_RET       sets @addr to the timestamp of the current block
    static final short GET_CREATION_TIMESTAMP    = 0x0301; // EXT_FUN_RET       sets @addr to the timestamp of the AT creation block
    static final short GET_LAST_BLOCK_TIMESTAMP  = 0x0302; // EXT_FUN_RET       sets @addr to the timestamp of the previous block
    static final short PUT_LAST_BLOCK_HASH_IN_A  = 0x0303; // EXT_FUN           puts the block hash of the previous block in A
    static final short A_TO_TX_AFTER_TIMESTAMP   = 0x0304; // EXT_FUN_DAT       sets A to tx hash of the first tx after $addr timestamp
    static final short GET_TYPE_FOR_TX_IN_A      = 0x0305; // EXT_FUN_RET       if A is a valid tx then @addr to tx type*
    static final short GET_AMOUNT_FOR_TX_IN_A    = 0x0306; // EXT_FUN_RET       if A is a valid tx then @addr to tx amount**
    static final short GET_TIMESTAMP_FOR_TX_IN_A = 0x0307; // EXT_FUN_RET       if A is a valid tx then @addr to the tx timestamp
    static final short GET_RANDOM_ID_FOR_TX_IN_A = 0x0308; // EXT_FUN_RET       if A is a valid tx then @addr to the tx random id***
    static final short MESSAGE_FROM_TX_IN_A_TO_B = 0x0309; // EXT_FUN           if A is a valid tx then B to the tx message****
    static final short B_TO_ADDRESS_OF_TX_IN_A   = 0x030a; // EXT_FUN           if A is a valid tx then B set to the tx address
    static final short B_TO_ADDRESS_OF_CREATOR   = 0x030b; // EXT_FUN           sets B1 to the address of the AT's creator (or the creator of the AT id on B2 if B2!=0)
    static final short GET_CODE_HASH_ID          = 0x030c; // EXT_FUN_RET       sets @addr to the code hash ID of the AT's (or of the AT id on B2 if B2!=0)
    static final short B_TO_ASSET_IDS_OF_TX_IN_A = 0x030d; // EXT_FUN           if A is a valid tx then B set to the asset ids received (terminated by 0)

    static final short GET_CURRENT_BALANCE      = 0x0400; // EXT_FUN_RET       sets @addr to current balance of the AT for the asset id in B2 (or SIGNA if B2==0)
    static final short GET_PREVIOUS_BALANCE     = 0x0401; // EXT_FUN_RET       sets @addr to the balance it had last had when running*
    static final short SEND_TO_ADDRESS_IN_B     = 0x0402; // EXT_FUN_DAT       if B is a valid address then send it $addr amount**
    static final short SEND_ALL_TO_ADDRESS_IN_B = 0x0403; // EXT_FUN           if B is a valid address then send it the entire balance
    static final short SEND_OLD_TO_ADDRESS_IN_B = 0x0404; // EXT_FUN           if B is a valid address then send it the old balance**
    static final short SEND_A_TO_ADDRESS_IN_B   = 0x0405; // EXT_FUN           if B is a valid address then send it A as a message
    static final short ADD_MINUTES_TO_TIMESTAMP = 0x0406; // EXT_FUN_RET_DAT_2 set @addr1 to timestamp $addr2 plus $addr3 minutes***

    static final short GET_MAP_VALUE_KEYS_IN_A  = 0x0407; // EXT_FUN_RET       keys in A1, A2, and A3 (if A3==0 use the AT ID as key3)
    static final short SET_MAP_VALUE_KEYS_IN_A  = 0x0408; // EXT_FUN           keys in A1 and A2 with value in A4
    static final short ISSUE_ASSET              = 0x0409; // EXT_FUN_RET       issue asset with name in A and dec. places in B1, returns the asset id
    static final short MINT_ASSET               = 0x040a; // EXT_FUN           mint B1 quantity of asset ID in B2
    static final short DIST_TO_ASSET_HOLDERS    = 0x040b; // EXT_FUN           B1 min holding of asset ID in B2, A1 the signa amount to distribute, A3 the assetId to distribute, A4 the asset quantity to distribute
    static final short GET_ASSET_HOLDERS_COUNT  = 0x040c; // EXT_FUN_RET       number of tokens holders with more than B1 holdings of asset ID in B2
    static final short GET_ACTIVATION_FEE       = 0x040d; // EXT_FUN_RET       sets @addr to the activation fee of this AT (or the AT id on B2 if B2!=0)
    static final short PUT_LAST_BLOCK_GSIG_IN_A = 0x040e; // EXT_FUN           puts the block generation signature of the previous block in A
    static final short GET_ASSET_CIRCULATING    = 0x040f; // EXT_FUN_RET       total circulating supply of tokens of asset ID in B2

}

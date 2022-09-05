package brs.at;

import static brs.at.OpCode.*;

class AtApiController {
    private static final AtApiImpl atApi = new AtApiImpl();

    private AtApiController() {
    }

    public static long func(int funcNum, AtMachineState state) {
        switch (funcNum) {
            case Get_A1:
                return atApi.getA1(state);
            case Get_A2:
                return atApi.getA2(state);
            case Get_A3:
                return atApi.getA3(state);
            case Get_A4:
                return atApi.getA4(state);
            case Get_B1:
                return atApi.getB1(state);
            case Get_B2:
                return atApi.getB2(state);
            case Get_B3:
                return atApi.getB3(state);
            case Get_B4:
                return atApi.getB4(state);
            case Clear_A:
                atApi.clearA(state);
                break;
            case Clear_B:
                atApi.clearB(state);
                break;
            case Clear_A_And_B:
                atApi.clearA(state);
                atApi.clearB(state);
                break;
            case Copy_A_From_B:
                atApi.copyAFromB(state);
                break;
            case Copy_B_From_A:
                atApi.copyBFromA(state);
                break;
            case Check_A_Is_Zero:
                return atApi.checkAIsZero(state);
            case Check_B_Is_Zero:
                return atApi.checkBIsZero(state);
            case Check_A_Equals_B:
                return atApi.checkAEqualsB(state);
            case Swap_A_and_B:
                atApi.swapAAndB(state);
                break;
            case OR_A_with_B:
                atApi.orAWithB(state);
                break;
            case OR_B_with_A:
                atApi.orBWithA(state);
                break;
            case AND_A_with_B:
                atApi.andAWithB(state);
                break;
            case AND_B_with_A:
                atApi.andBWithA(state);
                break;
            case XOR_A_with_B:
                atApi.xorAWithB(state);
                break;
            case XOR_B_with_A:
                atApi.xorBWithA(state);
                break;
            case 320:
                atApi.addAToB(state);
                break;
            case 321:
                atApi.addBToA(state);
                break;
            case 322:
                atApi.subAFromB(state);
                break;
            case 323:
                atApi.subBFromA(state);
                break;
            case 324:
                atApi.mulAByB(state);
                break;
            case 325:
                atApi.mulBByA(state);
                break;
            case 326:
                atApi.divAByB(state);
                break;
            case 327:
                atApi.divBByA(state);
                break;

            case MD5_A_TO_B:
                atApi.md5Atob(state);
                break;
            case CHECK_MD5_A_WITH_B:
                return atApi.checkMd5AWithB(state);
            case HASH160_A_TO_B:
                atApi.hash160AToB(state);
                break;
            case CHECK_HASH160_A_WITH_B:
                return atApi.checkHash160AWithB(state);
            case SHA256_A_To_B:
                atApi.sha256AToB(state);
                break;
            case OpCode.CHECK_SHA256_A_WITH_B:
                return atApi.checkSha256AWithB(state);
            case OpCode.CHECK_SIG_B_WITH_A:
                return atApi.checkSignBWithA(state);


            case GET_BLOCK_TIMESTAMP:
                return atApi.getBlockTimestamp(state);
            case GET_CREATION_TIMESTAMP:
                return atApi.getCreationTimestamp(state);
            case GET_LAST_BLOCK_TIMESTAMP:
                return atApi.getLastBlockTimestamp(state);
            case OpCode.PUT_LAST_BLOCK_HASH_IN_A:
                atApi.putLastBlockHashInA(state);
                break;
            case OpCode.PUT_LAST_BLOCK_GSIG_IN_A:
                if(state.getVersion() > 2){
                  atApi.putLastBlockGenerationSignatureInA(state);
                }
                break;

            case GET_TYPE_FOR_TX_IN_A:
                return atApi.getTypeForTxInA(state);
            case GET_AMOUNT_FOR_TX_IN_A:
                return atApi.getAmountForTxInA(state);
            case GET_TIMESTAMP_FOR_TX_IN_A:
                return atApi.getTimestampForTxInA(state);
            case GET_RANDOM_ID_FOR_TX_IN_A:
                return atApi.getRandomIdForTxInA(state);
            case OpCode.MESSAGE_FROM_TX_IN_A_TO_B:
                atApi.messageFromTxInAToB(state);
                break;
            case B_TO_ADDRESS_OF_TX_IN_A:
                atApi.bToAddressOfTxInA(state);
                break;
            case B_TO_ASSET_IDS_OF_TX_IN_A:
                atApi.bToAssetsOfTxInA(state);
                break;
            case OpCode.B_TO_ADDRESS_OF_CREATOR:
                atApi.bToAddressOfCreator(state);
                break;
            case OpCode.GET_CODE_HASH_ID:
                return atApi.getCodeHashId(state);

            case GET_CURRENT_BALANCE:
                return atApi.getCurrentBalance(state);
            case GET_PREVIOUS_BALANCE:
                return atApi.getPreviousBalance(state);
            case SEND_ALL_TO_ADDRESS_IN_B:
                atApi.sendAllToAddressInB(state);
                break;
            case SEND_OLD_TO_ADDRESS_IN_B:
                atApi.sendOldToAddressInB(state);
                break;
            case SEND_A_TO_ADDRESS_IN_B:
                atApi.sendAToAddressInB(state);
                break;

            case GET_MAP_VALUE_KEYS_IN_A:
              return atApi.getMapValueKeysInA(state);
            case SET_MAP_VALUE_KEYS_IN_A:
              atApi.setMapValueKeysInA(state);
              break;
            case ISSUE_ASSET:
              return atApi.issueAsset(state);
            case MINT_ASSET:
              atApi.mintAsset(state);
              break;
            case DIST_TO_ASSET_HOLDERS:
              atApi.distToHolders(state);
              break;
            case GET_ASSET_HOLDERS_COUNT:
              return atApi.getAssetHoldersCount(state);
            case GET_ASSET_CIRCULATING:
              return atApi.getAssetCirculating(state);

            case OpCode.GET_ACTIVATION_FEE:
              return atApi.getActivationFee(state);


            default:
                return 0;
        }
        return 0;
    }

    public static long func1(int funcNum, long val, AtMachineState state) {
        switch (funcNum) {
            case Set_A1:
                atApi.setA1(val, state);
                break;
            case Set_A2:
                atApi.setA2(val, state);
                break;
            case Set_A3:
                atApi.setA3(val, state);
                break;
            case Set_A4:
                atApi.setA4(val, state);
                break;
            case Set_B1:
                atApi.setB1(val, state);
                break;
            case Set_B2:
                atApi.setB2(val, state);
                break;
            case Set_B3:
                atApi.setB3(val, state);
                break;
            case Set_B4:
                atApi.setB4(val, state);
                break;
            case A_TO_TX_AFTER_TIMESTAMP:
                atApi.aToTxAfterTimestamp(val, state);
                break;
            case SEND_TO_ADDRESS_IN_B:
                atApi.sendToAddressInB(val, state);
                break;
            default:
                return 0;
        }
        return 0;
    }

    public static long func2(int funcNum, long val1, long val2, AtMachineState state) {
        switch (funcNum) {
            case Set_A1_A2:
                atApi.setA1A2(val1, val2, state);
                break;
            case Set_A3_A4:
                atApi.setA3A4(val1, val2, state);
                break;
            case Set_B1_B2:
                atApi.setB1B2(val1, val2, state);
                break;
            case Set_B3_B4:
                atApi.setB3B4(val1, val2, state);
                break;
            case ADD_MINUTES_TO_TIMESTAMP:
                return atApi.addMinutesToTimestamp(val1, val2, state);
            default:
                return 0;
        }
        return 0;
    }
}

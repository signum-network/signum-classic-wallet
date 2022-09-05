package brs.at;

import brs.Burst;
import brs.Constants;
import brs.fluxcapacitor.FluxValues;

import java.util.HashMap;


public class AtConstants {
    //platform based
    public static final int AT_ID_SIZE = 8;
    private static final HashMap<Short, Long> MIN_FEE = new HashMap<>();
    private static final HashMap<Short, Long> STEP_FEE = new HashMap<>();
    private static final HashMap<Short, Long> MAX_STEPS = new HashMap<>();
    private static final HashMap<Short, Long> API_STEP_MULTIPLIER = new HashMap<>();
    private static final HashMap<Short, Long> COST_PER_PAGE = new HashMap<>();
    private static final HashMap<Short, Long> MAX_WAIT_FOR_NUM_OF_BLOCKS = new HashMap<>();
    private static final HashMap<Short, Long> MAX_SLEEP_BETWEEN_BLOCKS = new HashMap<>();
    private static final HashMap<Short, Long> PAGE_SIZE = new HashMap<>();
    private static final HashMap<Short, Long> MAX_MACHINE_CODE_PAGES = new HashMap<>();
    private static final HashMap<Short, Long> MAX_MACHINE_DATA_PAGES = new HashMap<>();
    private static final HashMap<Short, Long> MAX_MACHINE_USER_STACK_PAGES = new HashMap<>();
    private static final HashMap<Short, Long> MAX_MACHINE_CALL_STACK_PAGES = new HashMap<>();
    private static final HashMap<Short, Long> BLOCKS_FOR_RANDOM = new HashMap<>();
    private static final HashMap<Short, Long> AVERAGE_BLOCK_MINUTES = new HashMap<>();
    private static final AtConstants instance = new AtConstants();

    private AtConstants() {
        // constants for AT version 1
        MIN_FEE.put((short) 1, 1000L);
        STEP_FEE.put((short) 1, 100000000L / 10L);
        MAX_STEPS.put((short) 1, 2000L);
        API_STEP_MULTIPLIER.put((short) 1, 10L);

        COST_PER_PAGE.put((short) 1, 100000000L);

        MAX_WAIT_FOR_NUM_OF_BLOCKS.put((short) 1, 31536000L);
        MAX_SLEEP_BETWEEN_BLOCKS.put((short) 1, 31536000L);

        PAGE_SIZE.put((short) 1, 256L);

        MAX_MACHINE_CODE_PAGES.put((short) 1, 10L);
        MAX_MACHINE_DATA_PAGES.put((short) 1, 10L);
        MAX_MACHINE_USER_STACK_PAGES.put((short) 1, 10L);
        MAX_MACHINE_CALL_STACK_PAGES.put((short) 1, 10L);

        BLOCKS_FOR_RANDOM.put((short) 1, 15L); //for testing 2 -> normally 1440
        AVERAGE_BLOCK_MINUTES.put((short) 1, 4L);
        // end of AT version 1

        // constants for AT version 2
        MIN_FEE.put((short) 2, 1000L);
        STEP_FEE.put((short) 2, Constants.FEE_QUANT_SIP3 / 10L);
        MAX_STEPS.put((short) 2, 100_000L);
        API_STEP_MULTIPLIER.put((short) 2, 10L);

        COST_PER_PAGE.put((short) 2, Constants.FEE_QUANT_SIP3 * 10);

        MAX_WAIT_FOR_NUM_OF_BLOCKS.put((short) 2, 31536000L);
        MAX_SLEEP_BETWEEN_BLOCKS.put((short) 2, 31536000L);

        PAGE_SIZE.put((short) 2, 256L);

        MAX_MACHINE_CODE_PAGES.put((short) 2, 20L);
        MAX_MACHINE_DATA_PAGES.put((short) 2, 10L);
        MAX_MACHINE_USER_STACK_PAGES.put((short) 2, 10L);
        MAX_MACHINE_CALL_STACK_PAGES.put((short) 2, 10L);

        BLOCKS_FOR_RANDOM.put((short) 2, 15L); //for testing 2 -> normally 1440
        AVERAGE_BLOCK_MINUTES.put((short) 2, 4L);
        // end of AT version 2

        // constants for AT version 3
        MIN_FEE.put((short) 3, 1000L);
        STEP_FEE.put((short) 3, Constants.FEE_QUANT_SIP34 / 10L);
        MAX_STEPS.put((short) 3, 100_000L);
        API_STEP_MULTIPLIER.put((short) 3, 10L);

        COST_PER_PAGE.put((short) 3, Constants.FEE_QUANT_SIP34 * 10);

        MAX_WAIT_FOR_NUM_OF_BLOCKS.put((short) 3, 31536000L);
        MAX_SLEEP_BETWEEN_BLOCKS.put((short) 3, 31536000L);

        PAGE_SIZE.put((short) 3, 256L);

        MAX_MACHINE_CODE_PAGES.put((short) 3, 40L);
        MAX_MACHINE_DATA_PAGES.put((short) 3, 10L);
        MAX_MACHINE_USER_STACK_PAGES.put((short) 3, 10L);
        MAX_MACHINE_CALL_STACK_PAGES.put((short) 3, 10L);

        BLOCKS_FOR_RANDOM.put((short) 3, 15L); //for testing 2 -> normally 1440
        AVERAGE_BLOCK_MINUTES.put((short) 3, 4L);
        // end of AT version 3
    }

    public static AtConstants getInstance() {
        return instance;
    }

    public short atVersion(int blockHeight) {
        return Burst.getFluxCapacitor().getValue(FluxValues.AT_VERSION, blockHeight);
    }

    public long stepFee(short version) {
        return STEP_FEE.get(version);
    }

    public long maxSteps(int height) {
        if(Burst.getFluxCapacitor().getValue(FluxValues.SIGNUM, height)) {
            return 1_000_000L;
        }
        return MAX_STEPS.get(atVersion(height));
    }

    public long apiStepMultiplier(short version) {
        return API_STEP_MULTIPLIER.get(version);
    }

    public long costPerPage(int height) {
        return COST_PER_PAGE.get(atVersion(height));
    }

    public long getMaxWaitForNumOfBlocks(int height) {
        return MAX_WAIT_FOR_NUM_OF_BLOCKS.get(atVersion(height));
    }

    public long maxSleepBetweenBlocks(int height) {
        return MAX_SLEEP_BETWEEN_BLOCKS.get(atVersion(height));
    }

    public long pageSize(short version) {
        return PAGE_SIZE.get(version);
    }

    public long maxMachineCodePages(short version) {
        return MAX_MACHINE_CODE_PAGES.get(version);
    }

    public long maxMachineDataPages(short version) {
        return MAX_MACHINE_DATA_PAGES.get(atVersion(version));
    }

    public long maxMachineUserStackPages(short version) {
        return MAX_MACHINE_USER_STACK_PAGES.get(atVersion(version));
    }

    public long maxMachineCallStackPages(short version) {
        return MAX_MACHINE_CALL_STACK_PAGES.get(atVersion(version));
    }

    public long blocksForRandom(int height) {
        return BLOCKS_FOR_RANDOM.get(atVersion(height));
    }

    public long averageBlockMinutes(int height) {
        return AVERAGE_BLOCK_MINUTES.get(atVersion(height));
    }
}

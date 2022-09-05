/*
 * Copyright (c) 2014 CIYAM Developers

 Distributed under the MIT/X11 software license, please refer to the file license.txt
 in the root project directory or http://www.opensource.org/licenses/mit-license.php.

*/
package brs.at;

public class AtBlock {
    private final long totalFees;
    private final long totalAmount;
    private final byte[] bytesForBlock;

    AtBlock(long totalFees, long totalAmount, byte[] bytesForBlock) {
        this.totalFees = totalFees;
        this.totalAmount = totalAmount;
        this.bytesForBlock = bytesForBlock;
    }

    public long getTotalFees() {
        return totalFees;
    }

    public long getTotalAmount() {
        return totalAmount;
    }

    public byte[] getBytesForBlock() {
        return bytesForBlock;
    }
}

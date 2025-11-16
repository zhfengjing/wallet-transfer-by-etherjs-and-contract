/**
 * 加密工具类
 * 使用简单的 XOR 加密和16进制编码
 */
export class CryptoUtils {
    constructor() {
        // 使用一个固定的密钥（实际应用中应该使用更安全的密钥管理方式）
        this.secretKey = 'MySecretKey123456789';
    }

    /**
     * 加密文本并转换为16进制
     * @param {string} text - 要加密的明文
     * @returns {string} 16进制加密数据
     */
    encrypt(text) {
        if (!text) return '';

        try {
            // 将文本转换为字节数组
            const textBytes = this.stringToBytes(text);
            const keyBytes = this.stringToBytes(this.secretKey);

            // XOR 加密
            const encrypted = [];
            for (let i = 0; i < textBytes.length; i++) {
                encrypted.push(textBytes[i] ^ keyBytes[i % keyBytes.length]);
            }

            // 转换为16进制字符串
            const hexString = encrypted.map(byte => {
                return byte.toString(16).padStart(2, '0');
            }).join('');

            return hexString;
        } catch (error) {
            console.error('加密失败:', error);
            throw new Error('加密过程中发生错误');
        }
    }

    /**
     * 从16进制解密文本
     * @param {string} hexString - 16进制加密数据
     * @returns {string} 解密后的明文
     */
    decrypt(hexString) {
        if (!hexString) return '';

        try {
            // 移除可能存在的 0x 前缀
            hexString = hexString.replace(/^0x/, '');

            // 验证16进制格式
            if (!/^[0-9a-fA-F]*$/.test(hexString)) {
                throw new Error('无效的16进制字符串');
            }

            // 将16进制字符串转换为字节数组
            const encrypted = [];
            for (let i = 0; i < hexString.length; i += 2) {
                encrypted.push(parseInt(hexString.substr(i, 2), 16));
            }

            const keyBytes = this.stringToBytes(this.secretKey);

            // XOR 解密
            const decrypted = [];
            for (let i = 0; i < encrypted.length; i++) {
                decrypted.push(encrypted[i] ^ keyBytes[i % keyBytes.length]);
            }

            // 转换回字符串
            return this.bytesToString(decrypted);
        } catch (error) {
            console.error('解密失败:', error);
            throw new Error('解密过程中发生错误: ' + error.message);
        }
    }

    /**
     * 字符串转字节数组
     * @param {string} str 
     * @returns {Array<number>}
     */
    stringToBytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i) & 0xFF);
        }
        return bytes;
    }

    /**
     * 字节数组转字符串
     * @param {Array<number>} bytes 
     * @returns {string}
     */
    bytesToString(bytes) {
        return bytes.map(byte => String.fromCharCode(byte)).join('');
    }

    /**
     * 将16进制字符串转换为字节数组
     * @param {string} hex 
     * @returns {Uint8Array}
     */
    hexToBytes(hex) {
        hex = hex.replace(/^0x/, '');
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    /**
     * 将字节数组转换为16进制字符串
     * @param {Uint8Array} bytes 
     * @returns {string}
     */
    bytesToHex(bytes) {
        return Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }
}

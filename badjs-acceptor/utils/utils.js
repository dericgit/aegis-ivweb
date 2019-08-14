module.exports = {
    /**
     * 获取 request cookies 中的 uin
     * @param {Object} cookies - request cookies
     * @returns {number}
     */
    getRequestUser(cookies = {}) {
        const pUin = cookies.p_uin || '';
        return +pUin.replace(/\D/, '');
    }
};

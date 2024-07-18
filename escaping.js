const escapeMap = {
    '\0': '\\0', // Null character
    '\x01': '\\x01', // Start of Heading
    '\x02': '\\x02', // Start of Text
    '\x03': '\\x03', // End of Text
    '\x04': '\\x04', // End of Transmission
    '\x05': '\\x05', // Enquiry
    '\x06': '\\x06', // Acknowledge
    '\x07': '\\x07', // Bell
    '\b': '\\b', // Backspace
    '\t': '\\t', // Horizontal Tab
    '\n': '\\n', // Newline
    '\x0b': '\\x0b', // Vertical Tab
    '\f': '\\f', // Form Feed
    '\r': '\\r', // Carriage Return
    '\x0e': '\\x0e', // Shift Out
    '\x0f': '\\x0f', // Shift In
    '\x10': '\\x10', // Data Link Escape
    '\x11': '\\x11', // Device Control 1
    '\x12': '\\x12', // Device Control 2
    '\x13': '\\x13', // Device Control 3
    '\x14': '\\x14', // Device Control 4
    '\x15': '\\x15', // Negative Acknowledge
    '\x16': '\\x16', // Synchronous Idle
    '\x17': '\\x17', // End of Transmission Block
    '\x18': '\\x18', // Cancel
    '\x19': '\\x19', // End of Medium
    '\x1a': '\\x1a', // Substitute
    '\x1b': '\\x1b', // Escape
    '\x1c': '\\x1c', // File Separator
    '\x1d': '\\x1d', // Group Separator
    '\x1e': '\\x1e', // Record Separator
    '\x1f': '\\x1f', // Unit Separator
    '\"': '\\\"', // Double quote
    '\'': '\\\'', // Single quote
    '\\': '\\\\', // Backslash
    '\`': '\\`', // Backtick (template literal)
    '\${': '\\${' // Dollar sign and opening curly brace
};

function escapeUserInput(inputString) {
    return inputString.replace(/[\0-\x1F\"\'\\\`\${]/g, function (match) {
        return escapeMap[match] || '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
    });
}

module.exports = escapeUserInput;
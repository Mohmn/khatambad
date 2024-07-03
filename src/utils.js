function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function expandValues(maxVals, extendSize = 1) {
  if (!maxVals) return "";
  let str = "";
  for (let i = 0; i < extendSize; i++) {
    str += "(";
    for (let j = i * maxVals; j < maxVals * (i + 1); j++) {
      const isLastIndex = j === maxVals * (i + 1) - 1;
      str += isLastIndex ? `$${j + 1}` : `$${j + 1},`;
    }
    const isLastIndex = i === extendSize - 1;

    str += isLastIndex ? ")" : "),";
  }
  return str;
}

export { shuffleArray, expandValues };

/*
// Initialize the 2D array
const arr2D = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [1, 2, 3]
];
*/

// Initialize an object to store the value counts
const valueCounts = {};

const entropy = (arr2D) => {

    // Loop through the 2D array and increment the value counts
    for (let i = 0; i < arr2D.length; i++) {
      const row = arr2D[i];
      for (let j = 0; j < row.length; j++) {
        const value = row[j];
        if (value in valueCounts) {
          valueCounts[value]++;
        } else {
          valueCounts[value] = 1;
        }
      }
    }
    const valueCounts2 = Object.values(valueCounts);
    const sum = valueCounts2.reduce((a, b) => a + b, 0);

    // Normalize the list
    const normalizedList = valueCounts2.map((value) => value / sum);

    // Print the normalized list
    let entropy = 0;
    for (const frequency of normalizedList) {
      entropy -= frequency * Math.log2(frequency);
    }
    return entropy;
};

// Print the entropy
//console.log(entropy);

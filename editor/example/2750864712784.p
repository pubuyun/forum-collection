DECLARE numbers:ARRAY[1:10] OF INTEGER
FOR j <- 1 TO 10
    numbers[j] <- "1"
    OUTPUT "OUT", numbers[j]
NEXT j
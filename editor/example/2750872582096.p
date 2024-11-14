DECLARE arr:ARRAY[1:20] OF REAL

FUNCTION find_number(num:REAL) RETURNS INTEGER
    DECLARE i:INTEGER 
    FOR i <- 1 TO 20
        IF arr[i] = num THEN
            OUTPUT "It is the", i, "number that you inputted"
            RETURN i
        ENDIF
    NEXT i
    OUTPUT "Number not found"
    RETURN -1
ENDFUNCTION

DECLARE i:INTEGER
FOR i <- 1 TO 20
    INPUT arr[i]
NEXT i

DECLARE continue:STRING
DECLARE userinput:REAL
DECLARE temp:INTEGER
continue <- "Yes"
REPEAT
    OUTPUT "Which number would you like to find"
    INPUT userinput
    temp <- find_number(userinput)
    OUTPUT "Would you like to enter another number? (Yes/No)"
    INPUT continue
UNTIL continue = "No"


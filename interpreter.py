import sys

# filepath = sys.argv[1]

# Tokenize
lines = ['DECLARE a:INTEGER']
# with open(filepath, 'r') as file:
#     lines = [line.strip() for line in file.readlines()]

program = []
token_cnt = 0
label_tracker = {}
declared_variables = {}
declared_variables
for line in lines:
    parts = line.split(" ")
    opcode = parts[0]
    
    # enpty line
    if opcode == "":
        continue
    
    # store token
    program.append(opcode)
    token_cnt += 1
    
    if opcode == "DECLARE":
        # expecting <identifier>:<type>
        string = ''.join(parts[1:])
        identifier = string.split(':')[0]
        vartype = string.split(':')[1]
        # TODO: check identifier and match the most simmilar one
        declared_variables.update({identifier:vartype})
    elif parts.split("<-")[0] in declared_variables:
        statement = ''.join(parts.split("<-")[1:])

    elif opcode == "OUTPUT":
        statement = ''.join()
        
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;


contract TodoRegistry {
  
    struct TodoRecord {
        bytes32 todoHash;      // SHA256 hash of todo data
        address owner;         // User's wallet address
        uint256 timestamp;     // Creation timestamp
        bool isDeleted;        // Soft delete flag
    }

    // Mapping from todoId (MongoDB ObjectId as string) to TodoRecord
    mapping(string => TodoRecord) private todos;

    // Events for logging
    event TodoCreated(
        string indexed todoId,
        bytes32 todoHash,
        address indexed owner,
        uint256 timestamp
    );

    event TodoUpdated(
        string indexed todoId,
        bytes32 oldHash,
        bytes32 newHash,
        uint256 timestamp
    );

    event TodoDeleted(
        string indexed todoId,
        uint256 timestamp
    );

    event TodoRestored(
        string indexed todoId,
        uint256 timestamp
    );


    modifier onlyTodoOwner(string memory todoId) {
        require(bytes(todoId).length > 0, "Todo ID cannot be empty");
        require(todos[todoId].owner == msg.sender, "Not authorized: caller is not the todo owner");
        _;
    }


    modifier todoExists(string memory todoId) {
        require(todos[todoId].timestamp > 0, "Todo does not exist");
        _;
    }

 
    function createTodo(
        string memory todoId,
        bytes32 todoHash
    ) external {
        require(bytes(todoId).length > 0, "Todo ID cannot be empty");
        require(todoHash != bytes32(0), "Todo hash cannot be empty");
        require(todos[todoId].timestamp == 0, "Todo already exists");

        todos[todoId] = TodoRecord({
            todoHash: todoHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            isDeleted: false
        });

        emit TodoCreated(todoId, todoHash, msg.sender, block.timestamp);
    }

    
    function updateTodo(
        string memory todoId,
        bytes32 newHash
    ) external todoExists(todoId) onlyTodoOwner(todoId) {
        require(newHash != bytes32(0), "New hash cannot be empty");
        require(!todos[todoId].isDeleted, "Cannot update deleted todo");

        bytes32 oldHash = todos[todoId].todoHash;
        todos[todoId].todoHash = newHash;

        emit TodoUpdated(todoId, oldHash, newHash, block.timestamp);
    }

   
    function deleteTodo(
        string memory todoId
    ) external todoExists(todoId) onlyTodoOwner(todoId) {
        require(!todos[todoId].isDeleted, "Todo is already deleted");

        todos[todoId].isDeleted = true;

        emit TodoDeleted(todoId, block.timestamp);
    }

    
    function restoreTodo(
        string memory todoId
    ) external todoExists(todoId) onlyTodoOwner(todoId) {
        require(todos[todoId].isDeleted, "Todo is not deleted");

        todos[todoId].isDeleted = false;

        emit TodoRestored(todoId, block.timestamp);
    }

    
    function verifyTodo(
        string memory todoId,
        bytes32 expectedHash
    ) external view todoExists(todoId) returns (bool) {
        return todos[todoId].todoHash == expectedHash;
    }

  
    function getTodo(
        string memory todoId
    ) external view todoExists(todoId) returns (
        bytes32 todoHash,
        address owner,
        uint256 timestamp,
        bool isDeleted
    ) {
        TodoRecord memory todo = todos[todoId];
        return (
            todo.todoHash,
            todo.owner,
            todo.timestamp,
            todo.isDeleted
        );
    }

    
    function todoExistsByID(string memory todoId) external view returns (bool) {
        return todos[todoId].timestamp > 0;
    }
}

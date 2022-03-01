// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2015, 2016, 2017 Dapphub
// Adapted by Ethereum Community 2021
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IWETH10 is IERC20 {
    function deposit() external payable;

    function depositTo(address to) external payable;

    function withdraw(uint256 value) external;

    function withdrawTo(address payable to, uint256 value) external;

    function withdrawFrom(
        address from,
        address payable to,
        uint256 value
    ) external;
}

contract MockWETH is IWETH10 {
    string public constant name = 'Wrapped Ether v10';
    string public constant symbol = 'WETH10';
    uint8 public constant decimals = 18;

    uint256 public immutable deploymentChainId;

    mapping(address => uint256) public override balanceOf;

    mapping(address => mapping(address => uint256)) public override allowance;

    constructor() {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        deploymentChainId = chainId;
    }

    function totalSupply() external view override returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        // _mintTo(msg.sender, msg.value);
        balanceOf[msg.sender] += msg.value;
        emit Transfer(address(0), msg.sender, msg.value);
    }

    function deposit() external payable override {
        // _mintTo(msg.sender, msg.value);
        balanceOf[msg.sender] += msg.value;
        emit Transfer(address(0), msg.sender, msg.value);
    }

    function depositTo(address to) external payable override {
        // _mintTo(to, msg.value);
        balanceOf[to] += msg.value;
        emit Transfer(address(0), to, msg.value);
    }

    function withdraw(uint256 value) external override {
        // _burnFrom(msg.sender, value);
        uint256 balance = balanceOf[msg.sender];
        require(balance >= value, 'WETH: burn amount exceeds balance');
        balanceOf[msg.sender] = balance - value;
        emit Transfer(msg.sender, address(0), value);

        // _transferEther(msg.sender, value);
        (bool success, ) = msg.sender.call{value: value}('');
        require(success, 'WETH: ETH transfer failed');
    }

    function withdrawTo(address payable to, uint256 value) external override {
        // _burnFrom(msg.sender, value);
        uint256 balance = balanceOf[msg.sender];
        require(balance >= value, 'WETH: burn amount exceeds balance');
        balanceOf[msg.sender] = balance - value;
        emit Transfer(msg.sender, address(0), value);

        // _transferEther(to, value);
        (bool success, ) = to.call{value: value}('');
        require(success, 'WETH: ETH transfer failed');
    }

    function withdrawFrom(
        address from,
        address payable to,
        uint256 value
    ) external override {
        if (from != msg.sender) {
            // _decreaseAllowance(from, msg.sender, value);
            uint256 allowed = allowance[from][msg.sender];
            if (allowed != type(uint256).max) {
                require(allowed >= value, 'WETH: request exceeds allowance');
                uint256 reduced = allowed - value;
                allowance[from][msg.sender] = reduced;
                emit Approval(from, msg.sender, reduced);
            }
        }

        // _burnFrom(from, value);
        uint256 balance = balanceOf[from];
        require(balance >= value, 'WETH: burn amount exceeds balance');
        balanceOf[from] = balance - value;
        emit Transfer(from, address(0), value);

        // _transferEther(to, value);
        (bool success, ) = to.call{value: value}('');
        require(success, 'WETH: Ether transfer failed');
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        // _approve(msg.sender, spender, value);
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);

        return true;
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        // _transferFrom(msg.sender, to, value);
        if (to != address(0)) {
            // Transfer
            uint256 balance = balanceOf[msg.sender];
            require(balance >= value, 'WETH: transfer amount exceeds balance');

            balanceOf[msg.sender] = balance - value;
            balanceOf[to] += value;
            emit Transfer(msg.sender, to, value);
        } else {
            // Withdraw
            uint256 balance = balanceOf[msg.sender];
            require(balance >= value, 'WETH: burn amount exceeds balance');
            balanceOf[msg.sender] = balance - value;
            emit Transfer(msg.sender, address(0), value);

            (bool success, ) = msg.sender.call{value: value}('');
            require(success, 'WETH: ETH transfer failed');
        }

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override returns (bool) {
        if (from != msg.sender) {
            // _decreaseAllowance(from, msg.sender, value);
            uint256 allowed = allowance[from][msg.sender];
            if (allowed != type(uint256).max) {
                require(allowed >= value, 'WETH: request exceeds allowance');
                uint256 reduced = allowed - value;
                allowance[from][msg.sender] = reduced;
                emit Approval(from, msg.sender, reduced);
            }
        }

        // _transferFrom(from, to, value);
        if (to != address(0)) {
            // Transfer
            uint256 balance = balanceOf[from];
            require(balance >= value, 'WETH: transfer amount exceeds balance');

            balanceOf[from] = balance - value;
            balanceOf[to] += value;
            emit Transfer(from, to, value);
        } else {
            // Withdraw
            uint256 balance = balanceOf[from];
            require(balance >= value, 'WETH: burn amount exceeds balance');
            balanceOf[from] = balance - value;
            emit Transfer(from, address(0), value);

            (bool success, ) = msg.sender.call{value: value}('');
            require(success, 'WETH: ETH transfer failed');
        }

        return true;
    }
}

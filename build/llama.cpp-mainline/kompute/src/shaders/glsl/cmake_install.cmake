# Install script for directory: C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/gpt4all/gpt4all-backend/llama.cpp-mainline/kompute/src/shaders/glsl

# Set the install prefix
if(NOT DEFINED CMAKE_INSTALL_PREFIX)
  set(CMAKE_INSTALL_PREFIX "C:/Program Files (x86)/llmodel")
endif()
string(REGEX REPLACE "/$" "" CMAKE_INSTALL_PREFIX "${CMAKE_INSTALL_PREFIX}")

# Set the install configuration name.
if(NOT DEFINED CMAKE_INSTALL_CONFIG_NAME)
  if(BUILD_TYPE)
    string(REGEX REPLACE "^[^A-Za-z0-9_]+" ""
           CMAKE_INSTALL_CONFIG_NAME "${BUILD_TYPE}")
  else()
    set(CMAKE_INSTALL_CONFIG_NAME "Release")
  endif()
  message(STATUS "Install configuration: \"${CMAKE_INSTALL_CONFIG_NAME}\"")
endif()

# Set the component getting installed.
if(NOT CMAKE_INSTALL_COMPONENT)
  if(COMPONENT)
    message(STATUS "Install component: \"${COMPONENT}\"")
    set(CMAKE_INSTALL_COMPONENT "${COMPONENT}")
  else()
    set(CMAKE_INSTALL_COMPONENT)
  endif()
endif()

# Is this installation the result of a crosscompile?
if(NOT DEFINED CMAKE_CROSSCOMPILING)
  set(CMAKE_CROSSCOMPILING "FALSE")
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  if(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Dd][Ee][Bb][Uu][Gg])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderOpMult.hpp")
  elseif(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Rr][Ee][Ll][Ee][Aa][Ss][Ee])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderOpMult.hpp")
  elseif(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Mm][Ii][Nn][Ss][Ii][Zz][Ee][Rr][Ee][Ll])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderOpMult.hpp")
  elseif(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Rr][Ee][Ll][Ww][Ii][Tt][Hh][Dd][Ee][Bb][Ii][Nn][Ff][Oo])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderOpMult.hpp")
  endif()
endif()

if(CMAKE_INSTALL_COMPONENT STREQUAL "Unspecified" OR NOT CMAKE_INSTALL_COMPONENT)
  if(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Dd][Ee][Bb][Uu][Gg])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderLogisticRegression.hpp")
  elseif(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Rr][Ee][Ll][Ee][Aa][Ss][Ee])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderLogisticRegression.hpp")
  elseif(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Mm][Ii][Nn][Ss][Ii][Zz][Ee][Rr][Ee][Ll])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderLogisticRegression.hpp")
  elseif(CMAKE_INSTALL_CONFIG_NAME MATCHES "^([Rr][Ee][Ll][Ww][Ii][Tt][Hh][Dd][Ee][Bb][Ii][Nn][Ff][Oo])$")
    file(INSTALL DESTINATION "${CMAKE_INSTALL_PREFIX}/include" TYPE FILE FILES "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/llama.cpp-mainline/kompute/src/shaders/glsl/ShaderLogisticRegression.hpp")
  endif()
endif()


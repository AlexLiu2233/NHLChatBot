# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION 3.5)

file(MAKE_DIRECTORY
  "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-src"
  "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-build"
  "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-subbuild/vulkan_header-populate-prefix"
  "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-subbuild/vulkan_header-populate-prefix/tmp"
  "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-subbuild/vulkan_header-populate-prefix/src/vulkan_header-populate-stamp"
  "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-subbuild/vulkan_header-populate-prefix/src"
  "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-subbuild/vulkan_header-populate-prefix/src/vulkan_header-populate-stamp"
)

set(configSubDirs Debug)
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-subbuild/vulkan_header-populate-prefix/src/vulkan_header-populate-stamp/${subDir}")
endforeach()
if(cfgdir)
  file(MAKE_DIRECTORY "C:/Users/liujp/OneDrive/Documents/Alex/School/2024/CPEN322/Assignment/project-right-weasel/build/_deps/vulkan_header-subbuild/vulkan_header-populate-prefix/src/vulkan_header-populate-stamp${cfgdir}") # cfgdir has leading slash
endif()

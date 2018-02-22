import React, { Component } from 'react'
import { Text, View, Image } from 'react-native'
import other from 'src/other/Other'

export default class Example2Custom extends Component {
  render() {
    return (
      <View>
        <Text>我是控件2, 已经被替换的文件! 绿色图标 3</Text>
        <Image
          style={{ width: 50, height: 50 }}
          source={require('src/img/backButton.png')}
        />
        <Text>{other(Math.random()).id}</Text>
      </View>
    )
  }
}

import React, { Component } from 'react'
import { 
    StyleSheet, 
    Text, 
    View, 
    ImageBackground, 
    FlatList, // Lista de rolagem pelo dedo
    TouchableOpacity,
    Platform,
    //AsyncStorage // O AsyncStorage é tipo um banco nativo mas nao é banco. Ele guarda os dados no próprio cel
    //Tu apenas dá o JSON, o nome do storage e pronto... coisa mais simples do mundo!
} from 'react-native'
import axios from 'axios'
import { server, showError } from '../common'
import moment from 'moment'
import 'moment/locale/pt-br'
import commonStyles from '../commonStyles'
import Task from '../components/Task'
import Icon from 'react-native-vector-icons/FontAwesome'
import ActionButton from 'react-native-action-button'
import AddTask from './AddTask'

import todayImage from '../../assets/imgs/today.jpg'
import tomorrowImage from '../../assets/imgs/tomorrow.jpg'
import weekImage from '../../assets/imgs/week.jpg'
import monthImage from '../../assets/imgs/month.jpg'

export default class Agenda extends Component {
    state = {
        tasks: [
            /* { id: Math.random(), desc: 'Comprar o curso de react native',
                estimateAt: new Date(), doneAt: new Date() },
            { id: Math.random(), desc: 'Concluir o curso',
                estimateAt: new Date(), doneAt: null },
            { id: Math.random(), desc: 'Comprar o curso de react native',
                estimateAt: new Date(), doneAt: new Date() },
            { id: Math.random(), desc: 'Concluir o curso',
                estimateAt: new Date(), doneAt: null },
             */
        ],
        visibleTasks: [],
        showDoneTasks: true,  
        showAddTask: false, // Responsável por mostrar ou esconder o modal        
    }

    /* 
    //---Versão frontend com async storage---
    addTask = task => {
        
        const tasks = [...this.state.tasks]
        tasks.push({
            id: Math.random(),
            desc: task.desc,
            estimateAt: task.date,
            doneAt: null
        })

        this.setState({ tasks, showAddTask: false }, this.filterTasks)
    } */

    //---Versão com backend---
    addTask = async task => { //repare como usa async e argumento na msm função
        try {
            await axios.post(`${server}/tasks`, {
                desc: task.desc,
                estimateAt: task.date
            })

            this.setState({ showAddTask:false }, this.loadTasks)
        } catch (err) {
            showError(err)
        }
    }

    /* 
    //---Versão frontend com async storage---
    deleteTask = id => {
        const tasks = this.state.tasks.filter(task => task.id !== id)
        this.setState({ tasks }, this.filterTasks)
    } */

    //---Versão com backend---
    // Existe um lance que o professor disse por alto q é o soft delete, onde deleta da tela mas não chega a deletar do banco
    deleteTask = async id => {
        try {
            await axios.delete(`${server}/tasks/${id}`)
            await this.loadTasks()
        } catch (err) {
            showError(err)
        }
    }

    filterTasks = () => {
        let visibleTasks = null
        if (this.state.showDoneTasks) {
            visibleTasks = [...this.state.tasks]
        } else {
            const pending = task => task.doneAt === null
            visibleTasks = this.state.tasks.filter(pending) //novo array com as tasks filtradas
        }
        this.setState({ visibleTasks })
        //Botou o storage no filterTask pq tudo chama filterTask
        //AsyncStorage.setItem('tasks', JSON.stringify(this.state.tasks))
    }

    toggleFilter = () => {
        this.setState({ showDoneTasks: !this.state.showDoneTasks}, this.filterTasks)
    }

    componentDidMount = async () => {
        /* 
        //---Versão frontend com async storage---
        const data = await AsyncStorage.getItem('tasks')
        const tasks = JSON.parse(data) || []
        this.setState({ tasks }, this.filterTasks) //filterTasks sendo chamado como callback */

        //---Versão com backend---
        this.loadTasks()
    }

    
    /* 
    //---Versão frontend com async storage---
    
    toggleTask = id => {
        
        const tasks = this.state.tasks.map(task => {
            if (task.id === id) {
                task = {...task}
                task.doneAt = task.doneAt ? null : new Date()
            }
            return task
        })
        this.setState({ tasks }, this.filterTasks) 
    } */
        
    //---Versão com backend---
    toggleTask = async id => {
        try {
            await axios.put(`${server}/tasks/${id}/toggle`)
            await this.loadTasks()
        } catch (err) {
            showError(err)
        }
    }

    loadTasks = async () => {
        try {
            const maxDate = moment()
                .add({ days: this.props.daysAhead })
                .format('YYYY-MM-DD 23:59')
            const res = await axios.get(`${server}/tasks?date=${maxDate}`)
            this.setState({ tasks: res.data }, this.filterTasks)
        } catch (err) {
            showError(err)
        }
    }

    render() {
        let styleColor = null
        let image = null

        switch(this.props.daysAhead) {
            case 0:
                styleColor = commonStyles.colors.today
                image = todayImage
                break
            case 1:
                styleColor = commonStyles.colors.tomorrow
                image = tomorrowImage
                break    
            case 7:
                styleColor = commonStyles.colors.week
                image = weekImage
                break
            default:
                styleColor = commonStyles.colors.month
                image = monthImage
                break
        }

        return (
            <View style={styles.container}>
                <AddTask isVisible={this.state.showAddTask}
                    onSave={this.addTask}
                    onCancel={() => this.setState({ showAddTask: false })} />
                <ImageBackground source={image} style={styles.background}>
                    <View style={styles.iconBar}>
                        <TouchableOpacity onPress={() => this.props.navigation.openDrawer()}>
                            <Icon name='bars' size={20} color={commonStyles.colors.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this.toggleFilter}>
                            <Icon name={this.state.showDoneTasks ? 'eye' : 'eye-slash'}
                                size={20} color={commonStyles.colors.secondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.titleBar}>
                        <Text style={styles.title}>{this.props.title}</Text>
                        <Text style={styles.subtitle}>
                            {moment().locale('pt-br').format('ddd, D [de] MMMM')}
                        </Text>
                    </View>
                </ImageBackground>
                <View style={styles.taskContainer}>
                    <FlatList data={this.state.visibleTasks}
                        keyExtractor={item => `${item.id}`}
                        renderItem={( { item }) => 
                        <Task {...item} onToggleTask={this.toggleTask}
                            onDelete={this.deleteTask} />} />
                </View>
                <ActionButton buttonColor={styleColor}
                    onPress={() => { this.setState({ showAddTask: true })}} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 3,
    },
    titleBar: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    title: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 50,
        marginLeft: 20,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 20,
        marginLeft: 20,
        marginBottom: 30,
    },
    taskContainer: {
        flex: 7,
    },
    iconBar: {
        marginTop: Platform.OS === 'ios' ? 30 : 10, //Se for iphone, dá uma margem maior no topo pq o app no ios come a barra superior onde mostra bateria, sinal...
        marginHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
})